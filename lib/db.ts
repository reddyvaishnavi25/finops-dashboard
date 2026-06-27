import { Pool, type ClientBase } from "pg"
import { DsqlSigner } from "@aws-sdk/dsql-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { fromNodeProviderChain } from "@aws-sdk/credential-providers"
import { attachDatabasePool } from "@vercel/functions"

// Environment-aware AWS credentials.
// IMPORTANT: do NOT gate on process.env.VERCEL_OIDC_TOKEN here. In a deployed
// Vercel function the OIDC token is injected per-request and is NOT present in
// process.env at module load (cold start), so checking it here would wrongly
// fall back to the node provider chain and fail with "no credentials".
//
// awsCredentialsProvider reads the OIDC token lazily at call time, so it works
// both at cold start and per request. We only use the standard AWS credential
// chain when real static keys are present (e.g. a teammate running locally with
// an IAM user's AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY).
const useStaticAwsKeys = !!process.env.AWS_ACCESS_KEY_ID
const credentials = useStaticAwsKeys
  ? fromNodeProviderChain({ clientConfig: { region: process.env.AWS_REGION ?? '' } })
  : awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN ?? '',
      clientConfig: { region: process.env.AWS_REGION ?? '' },
    })

const signer = new DsqlSigner({
  credentials,
  region: process.env.AWS_REGION ?? '',
  hostname: process.env.PGHOST ?? '',
  expiresIn: 900,
})

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER || "admin",
  database: process.env.PGDATABASE || "postgres",
  // IAM auth token is minted per connection and is valid for up to 15 minutes.
  password: () => signer.getDbConnectAdminAuthToken(),
  port: 5432,
  ssl: true,
  max: 20,
})
attachDatabasePool(pool)

// Single-statement query helper.
export async function query<T = unknown>(text: string, params?: unknown[]) {
  return pool.query<T extends Record<string, unknown> ? T : never>(text as string, params as never)
}

// Use for multi-query transactions (acquires a dedicated client).
export async function withConnection<T>(fn: (client: ClientBase) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}

// ---------------------------------------------------------------------------
// Optimistic Concurrency Control (OCC) retry
// ---------------------------------------------------------------------------
// Aurora DSQL is lock-free: it detects write/write conflicts at COMMIT time and
// aborts one of the transactions with SQLSTATE 40001 (serialization_failure) /
// "OC001". The correct response is to retry the whole transaction. This wrapper
// runs `fn` and retries on those conflicts with exponential backoff + jitter.
const OCC_CONFLICT_CODES = new Set(["40001", "OC000", "OC001"])

export class ConcurrencyConflictError extends Error {
  constructor(
    public attempts: number,
    public lastError: unknown,
  ) {
    super(`OCC conflict not resolved after ${attempts} attempts`)
    this.name = "ConcurrencyConflictError"
  }
}

export interface RetryResult<T> {
  value: T
  attempts: number // total tries (1 = succeeded first time, no conflict)
  retries: number // number of conflict-driven retries
}

function isOccConflict(err: unknown): boolean {
  const code = (err as { code?: string })?.code
  const msg = (err as { message?: string })?.message ?? ""
  return (!!code && OCC_CONFLICT_CODES.has(code)) || /OC0|concurrent|serializ/i.test(msg)
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<RetryResult<T>> {
  const maxAttempts = opts.maxAttempts ?? 25
  const baseDelayMs = opts.baseDelayMs ?? 10
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const value = await fn()
      return { value, attempts: attempt, retries: attempt - 1 }
    } catch (err) {
      lastError = err
      if (!isOccConflict(err) || attempt === maxAttempts) {
        if (isOccConflict(err)) throw new ConcurrencyConflictError(attempt, err)
        throw err
      }
      // Exponential backoff with full jitter.
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), 250)
      await new Promise((r) => setTimeout(r, Math.random() * delay))
    }
  }
  throw new ConcurrencyConflictError(maxAttempts, lastError)
}

// Runs a function inside a BEGIN/COMMIT transaction on a dedicated client, and
// wraps the whole thing in withRetry so OCC conflicts replay the transaction.
export async function withTransactionRetry<T>(
  fn: (client: ClientBase) => Promise<T>,
  opts?: { maxAttempts?: number; baseDelayMs?: number },
): Promise<RetryResult<T>> {
  return withRetry(async () => {
    return withConnection(async (client) => {
      await client.query("BEGIN")
      try {
        const result = await fn(client)
        await client.query("COMMIT")
        return result
      } catch (err) {
        try {
          await client.query("ROLLBACK")
        } catch {
          /* ignore rollback errors */
        }
        throw err
      }
    })
  }, opts)
}

// ---------------------------------------------------------------------------
// Application-layer referential integrity (DSQL has no foreign keys)
// ---------------------------------------------------------------------------
export async function tenantExists(tenantId: string): Promise<boolean> {
  const res = await pool.query("SELECT 1 FROM tenants WHERE tenant_id = $1", [tenantId])
  return res.rowCount! > 0
}

export async function workspaceBelongsToTenant(workspaceId: string, tenantId: string): Promise<boolean> {
  const res = await pool.query("SELECT 1 FROM workspaces WHERE workspace_id = $1 AND tenant_id = $2", [
    workspaceId,
    tenantId,
  ])
  return res.rowCount! > 0
}

export { pool }
