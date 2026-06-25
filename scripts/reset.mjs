// Clears all data (DSQL has no TRUNCATE, so we DELETE FROM each table).
// Run: node --env-file-if-exists=/vercel/share/.env.project scripts/reset.mjs
import pg from "pg"
import { DsqlSigner } from "@aws-sdk/dsql-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { fromNodeProviderChain } from "@aws-sdk/credential-providers"

const { Pool } = pg

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
  max: 5,
})

// Order matters only logically; no FKs in DSQL so any order works.
const TABLES = [
  "ledger_transactions",
  "endpoint_cost_summary",
  "tenant_usage_summary",
  "feature_usage_summary",
  "workspaces",
  "tenants",
]

async function main() {
  console.log("[v0] resetting all tables...")
  for (const t of TABLES) {
    const res = await pool.query(`DELETE FROM ${t}`)
    console.log(`[v0] cleared ${t} (${res.rowCount} rows)`)
  }
  console.log("[v0] reset complete")
  await pool.end()
}

main().catch((err) => {
  console.error("[v0] reset failed:", err)
  process.exit(1)
})
