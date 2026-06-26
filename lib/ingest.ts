import { randomUUID } from "node:crypto"
import type { ClientBase } from "pg"
import { withTransactionRetry, type RetryResult } from "./db"
import type { IngestEntryInput } from "./validation"

// Thrown when an optimistic version check fails. Tagged with an OCC code so the
// withRetry wrapper treats it like a native DSQL serialization conflict.
class VersionConflictError extends Error {
  code = "OC001"
  constructor(table: string) {
    super(`Optimistic version conflict on ${table}`)
    this.name = "VersionConflictError"
  }
}

// Read-modify-write a summary row with an explicit version check.
// If the row exists, increment totals only when the version is unchanged.
// If the UPDATE affects 0 rows, another writer moved first -> conflict -> retry.
async function bumpSummary(
  client: ClientBase,
  opts: {
    table: string
    keyCols: string[]
    keyVals: unknown[]
    costDelta: number
    tokenDelta: number
    requestCountCol: string // "request_count" or "total_requests"
  },
) {
  const { table, keyCols, keyVals, costDelta, tokenDelta, requestCountCol } = opts
  const where = keyCols.map((c, i) => `${c} = $${i + 1}`).join(" AND ")

  const existing = await client.query<{ version: number }>(
    `SELECT version FROM ${table} WHERE ${where}`,
    keyVals,
  )

  if (existing.rowCount && existing.rowCount > 0) {
    const currentVersion = existing.rows[0].version
    const res = await client.query(
      `UPDATE ${table}
         SET total_cost = total_cost + $${keyVals.length + 1},
             ${requestCountCol} = ${requestCountCol} + 1,
             total_tokens = total_tokens + $${keyVals.length + 2},
             version = version + 1,
             updated_at = CURRENT_TIMESTAMP
       WHERE ${where} AND version = $${keyVals.length + 3}`,
      [...keyVals, costDelta.toFixed(6), tokenDelta, currentVersion],
    )
    if (!res.rowCount) throw new VersionConflictError(table)
  } else {
    // First write for this key. A concurrent insert of the same PK will fail at
    // COMMIT (unique violation / serialization), which retry resolves.
    const cols = [...keyCols, "total_cost", requestCountCol, "total_tokens"]
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(",")
    await client.query(
      `INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders})`,
      [...keyVals, costDelta.toFixed(6), 1, tokenDelta],
    )
  }
}

export interface IngestOutcome {
  transaction_id: string
  attempts: number
  retries: number
}

// Atomically: insert one ledger row + update the three summary rollups.
// The whole thing runs in a single transaction wrapped in OCC retry.
export async function ingestLedgerEntry(entry: IngestEntryInput): Promise<RetryResult<{ transaction_id: string }>> {
  const transactionId = randomUUID()
  const tokens = entry.token_count ?? 0

  return withTransactionRetry(async (client) => {
    // 1. Append-only ledger insert.
    await client.query(
      `INSERT INTO ledger_transactions
        (transaction_id, tenant_id, workspace_id, feature_name, service_provider,
         service_name, api_endpoint, usage_type, usage_quantity, model_name,
         token_count, cost)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        transactionId,
        entry.tenant_id,
        entry.workspace_id,
        entry.feature_name,
        entry.service_provider,
        entry.service_name,
        entry.api_endpoint ?? null,
        entry.usage_type ?? null,
        entry.usage_quantity ?? null,
        entry.model_name ?? null,
        entry.token_count ?? null,
        entry.cost,
      ],
    )

    // 2. Endpoint rollup (only when an endpoint is provided).
    if (entry.api_endpoint) {
      await bumpSummary(client, {
        table: "endpoint_cost_summary",
        keyCols: ["tenant_id", "workspace_id", "api_endpoint"],
        keyVals: [entry.tenant_id, entry.workspace_id, entry.api_endpoint],
        costDelta: entry.cost,
        tokenDelta: tokens,
        requestCountCol: "request_count",
      })
    }

    // 3. Tenant rollup.
    await bumpSummary(client, {
      table: "tenant_usage_summary",
      keyCols: ["tenant_id"],
      keyVals: [entry.tenant_id],
      costDelta: entry.cost,
      tokenDelta: tokens,
      requestCountCol: "total_requests",
    })

    // 4. Feature rollup.
    await bumpSummary(client, {
      table: "feature_usage_summary",
      keyCols: ["tenant_id", "feature_name"],
      keyVals: [entry.tenant_id, entry.feature_name],
      costDelta: entry.cost,
      tokenDelta: tokens,
      requestCountCol: "total_requests",
    })

    return { transaction_id: transactionId }
  })
}
