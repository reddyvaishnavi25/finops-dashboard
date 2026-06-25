// Seeds the FinOps DB with realistic dummy data.
// Run: node --env-file-if-exists=/vercel/share/.env.project scripts/seed.mjs
import { randomUUID, createHash } from "node:crypto"
import pg from "pg"

// Deterministic UUIDv5-ish id from a name, so re-seeding reuses the same
// tenant/workspace rows instead of creating duplicates.
function stableId(name) {
  const h = createHash("sha256").update(name).digest("hex")
  return [h.slice(0, 8), h.slice(8, 12), "5" + h.slice(13, 16), "8" + h.slice(17, 20), h.slice(20, 32)].join("-")
}
import { DsqlSigner } from "@aws-sdk/dsql-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { fromNodeProviderChain } from "@aws-sdk/credential-providers"

const { Pool } = pg

// Use Vercel OIDC when available (in v0/Vercel), otherwise fall back to local AWS keys.
const credentials = process.env.VERCEL_OIDC_TOKEN
  ? awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN,
      clientConfig: { region: process.env.AWS_REGION },
    })
  : fromNodeProviderChain({ clientConfig: { region: process.env.AWS_REGION } })

const signer = new DsqlSigner({
  credentials,
  region: process.env.AWS_REGION,
  hostname: process.env.PGHOST,
  expiresIn: 900,
})

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER || "admin",
  database: process.env.PGDATABASE || "postgres",
  password: () => signer.getDbConnectAdminAuthToken(),
  port: 5432,
  ssl: true,
  max: 10,
})

// ---- Reference data -------------------------------------------------------
const TENANTS = [
  { company_name: "Acme Robotics", subscription_tier: "enterprise", workspaces: ["Production", "Staging", "Research"] },
  { company_name: "Nimbus Analytics", subscription_tier: "enterprise", workspaces: ["Core Platform", "Data Pipeline"] },
  { company_name: "Helix Health", subscription_tier: "growth", workspaces: ["Clinical AI", "Billing", "Patient Portal"] },
  { company_name: "Orbit Media", subscription_tier: "growth", workspaces: ["Content Studio", "Recommendations"] },
]

// provider -> services/models/endpoints/usage profiles
const CATALOG = [
  {
    provider: "OpenAI",
    feature: "Chat Assistant",
    service: "gpt-chat",
    model: "gpt-4o",
    endpoints: ["/v1/chat/completions"],
    usage_type: "tokens",
    unitCost: 0.000005, // per token
    tokenRange: [500, 8000],
  },
  {
    provider: "Anthropic",
    feature: "Chat Assistant",
    service: "claude-chat",
    model: "claude-3-5-sonnet",
    endpoints: ["/v1/messages"],
    usage_type: "tokens",
    unitCost: 0.000004,
    tokenRange: [600, 9000],
  },
  {
    provider: "OpenAI",
    feature: "Semantic Search",
    service: "embeddings",
    model: "text-embedding-3-large",
    endpoints: ["/v1/embeddings"],
    usage_type: "tokens",
    unitCost: 0.00000013,
    tokenRange: [100, 2000],
  },
  {
    provider: "OpenAI",
    feature: "Image Generation",
    service: "image-gen",
    model: "dall-e-3",
    endpoints: ["/v1/images/generations"],
    usage_type: "images",
    unitCost: 0.04, // per image
    tokenRange: null,
  },
  {
    provider: "AWS",
    feature: "Transcription",
    service: "transcribe",
    model: null,
    endpoints: ["/transcribe/jobs"],
    usage_type: "minutes",
    unitCost: 0.024, // per minute
    tokenRange: null,
  },
  {
    provider: "GCP",
    feature: "Translation",
    service: "translate",
    model: null,
    endpoints: ["/v3/projects:translateText"],
    usage_type: "characters",
    unitCost: 0.00002,
    tokenRange: null,
  },
]

const TOTAL_TXNS = 2000
const DAYS_BACK = 90
const BATCH_SIZE = 500 // well under DSQL's 3000-row / 10 MiB transaction limits

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[randInt(0, arr.length - 1)]

function buildTransactions(tenants) {
  const rows = []
  for (let i = 0; i < TOTAL_TXNS; i++) {
    const tenant = pick(tenants)
    const workspace = pick(tenant.workspaceRows)
    const c = pick(CATALOG)
    const endpoint = pick(c.endpoints)

    let usageQuantity
    let tokenCount = null
    let cost

    if (c.usage_type === "tokens") {
      tokenCount = randInt(c.tokenRange[0], c.tokenRange[1])
      usageQuantity = tokenCount
      cost = tokenCount * c.unitCost
    } else if (c.usage_type === "images") {
      usageQuantity = randInt(1, 20)
      cost = usageQuantity * c.unitCost
    } else if (c.usage_type === "minutes") {
      usageQuantity = randInt(1, 240)
      cost = usageQuantity * c.unitCost
    } else {
      usageQuantity = randInt(1000, 500000)
      cost = usageQuantity * c.unitCost
    }

    const daysAgo = randInt(0, DAYS_BACK)
    const created = new Date(Date.now() - daysAgo * 86400000 - randInt(0, 86399) * 1000)

    rows.push({
      transaction_id: randomUUID(),
      tenant_id: tenant.tenant_id,
      workspace_id: workspace.workspace_id,
      feature_name: c.feature,
      service_provider: c.provider,
      service_name: c.service,
      api_endpoint: endpoint,
      usage_type: c.usage_type,
      usage_quantity: Number(usageQuantity.toFixed(4)),
      model_name: c.model,
      token_count: tokenCount,
      cost: Number(cost.toFixed(6)),
      created_at: created.toISOString(),
    })
  }
  return rows
}

async function insertBatched(client, rows) {
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batch = rows.slice(start, start + BATCH_SIZE)
    const values = []
    const params = []
    batch.forEach((r, idx) => {
      const b = idx * 13
      values.push(
        `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11},$${b + 12},$${b + 13})`,
      )
      params.push(
        r.transaction_id, r.tenant_id, r.workspace_id, r.feature_name, r.service_provider,
        r.service_name, r.api_endpoint, r.usage_type, r.usage_quantity, r.model_name,
        r.token_count, r.cost, r.created_at,
      )
    })
    await client.query(
      `INSERT INTO ledger_transactions
        (transaction_id, tenant_id, workspace_id, feature_name, service_provider,
         service_name, api_endpoint, usage_type, usage_quantity, model_name,
         token_count, cost, created_at)
       VALUES ${values.join(",")}`,
      params,
    )
    console.log(`[v0] inserted ledger rows ${start + 1}-${start + batch.length}`)
  }
}

function rollups(rows) {
  const endpoint = new Map() // key tenant|workspace|endpoint
  const tenant = new Map() // key tenant
  const feature = new Map() // key tenant|feature

  for (const r of rows) {
    const tokens = r.token_count || 0

    const ek = `${r.tenant_id}|${r.workspace_id}|${r.api_endpoint}`
    const e = endpoint.get(ek) || { tenant_id: r.tenant_id, workspace_id: r.workspace_id, api_endpoint: r.api_endpoint, total_cost: 0, request_count: 0, total_tokens: 0 }
    e.total_cost += r.cost; e.request_count += 1; e.total_tokens += tokens
    endpoint.set(ek, e)

    const t = tenant.get(r.tenant_id) || { tenant_id: r.tenant_id, total_cost: 0, total_requests: 0, total_tokens: 0 }
    t.total_cost += r.cost; t.total_requests += 1; t.total_tokens += tokens
    tenant.set(r.tenant_id, t)

    const fk = `${r.tenant_id}|${r.feature_name}`
    const f = feature.get(fk) || { tenant_id: r.tenant_id, feature_name: r.feature_name, total_cost: 0, total_requests: 0, total_tokens: 0 }
    f.total_cost += r.cost; f.total_requests += 1; f.total_tokens += tokens
    feature.set(fk, f)
  }
  return { endpoint: [...endpoint.values()], tenant: [...tenant.values()], feature: [...feature.values()] }
}

async function main() {
  console.log("[v0] connecting to Aurora DSQL...")

  // 1. Tenants + workspaces (deterministic ids + upsert => idempotent)
  const tenantRows = TENANTS.map((t) => ({ ...t, tenant_id: stableId("tenant:" + t.company_name) }))
  for (const t of tenantRows) {
    await pool.query(
      `INSERT INTO tenants (tenant_id, company_name, subscription_tier) VALUES ($1,$2,$3)
       ON CONFLICT (tenant_id) DO NOTHING`,
      [t.tenant_id, t.company_name, t.subscription_tier],
    )
    t.workspaceRows = t.workspaces.map((name) => ({
      workspace_id: stableId("ws:" + t.company_name + ":" + name),
      workspace_name: name,
    }))
    for (const w of t.workspaceRows) {
      await pool.query(
        `INSERT INTO workspaces (workspace_id, tenant_id, workspace_name) VALUES ($1,$2,$3)
         ON CONFLICT (workspace_id) DO NOTHING`,
        [w.workspace_id, t.tenant_id, w.workspace_name],
      )
    }
  }
  console.log(`[v0] inserted ${tenantRows.length} tenants and their workspaces`)

  // 2. Ledger transactions (batched, dedicated client)
  const txns = buildTransactions(tenantRows)
  const client = await pool.connect()
  try {
    await insertBatched(client, txns)
  } finally {
    client.release()
  }

  // 3. Summary rollups computed from the same data
  const { endpoint, tenant, feature } = rollups(txns)
  for (const e of endpoint) {
    await pool.query(
      `INSERT INTO endpoint_cost_summary (tenant_id, workspace_id, api_endpoint, total_cost, request_count, total_tokens)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (tenant_id, workspace_id, api_endpoint) DO UPDATE SET
         total_cost = endpoint_cost_summary.total_cost + EXCLUDED.total_cost,
         request_count = endpoint_cost_summary.request_count + EXCLUDED.request_count,
         total_tokens = endpoint_cost_summary.total_tokens + EXCLUDED.total_tokens,
         version = endpoint_cost_summary.version + 1,
         updated_at = CURRENT_TIMESTAMP`,
      [e.tenant_id, e.workspace_id, e.api_endpoint, e.total_cost.toFixed(6), e.request_count, e.total_tokens],
    )
  }
  for (const t of tenant) {
    await pool.query(
      `INSERT INTO tenant_usage_summary (tenant_id, total_cost, total_requests, total_tokens)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (tenant_id) DO UPDATE SET
         total_cost = tenant_usage_summary.total_cost + EXCLUDED.total_cost,
         total_requests = tenant_usage_summary.total_requests + EXCLUDED.total_requests,
         total_tokens = tenant_usage_summary.total_tokens + EXCLUDED.total_tokens,
         version = tenant_usage_summary.version + 1,
         updated_at = CURRENT_TIMESTAMP`,
      [t.tenant_id, t.total_cost.toFixed(6), t.total_requests, t.total_tokens],
    )
  }
  for (const f of feature) {
    await pool.query(
      `INSERT INTO feature_usage_summary (tenant_id, feature_name, total_cost, total_requests, total_tokens)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (tenant_id, feature_name) DO UPDATE SET
         total_cost = feature_usage_summary.total_cost + EXCLUDED.total_cost,
         total_requests = feature_usage_summary.total_requests + EXCLUDED.total_requests,
         total_tokens = feature_usage_summary.total_tokens + EXCLUDED.total_tokens,
         version = feature_usage_summary.version + 1,
         updated_at = CURRENT_TIMESTAMP`,
      [f.tenant_id, f.feature_name, f.total_cost.toFixed(6), f.total_requests, f.total_tokens],
    )
  }
  console.log(`[v0] inserted summaries -> endpoints:${endpoint.length} tenants:${tenant.length} features:${feature.length}`)
  console.log("[v0] seed complete")
  await pool.end()
}

main().catch((err) => {
  console.error("[v0] seed failed:", err)
  process.exit(1)
})
