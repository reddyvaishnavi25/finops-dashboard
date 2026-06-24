// Runs every scripts/NNN-*.sql file in order against Aurora DSQL.
// Each statement is split on COMMIT (DSQL allows only one DDL per transaction).
// Run: node --env-file-if-exists=/vercel/share/.env.project scripts/run-migrations.mjs
import { readdir, readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"
import { DsqlSigner } from "@aws-sdk/dsql-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"

const { Pool } = pg
const scriptsDir = dirname(fileURLToPath(import.meta.url))

const signer = new DsqlSigner({
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN,
    clientConfig: { region: process.env.AWS_REGION },
  }),
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

async function main() {
  const files = (await readdir(scriptsDir))
    .filter((f) => /^\d+.*\.sql$/.test(f))
    .sort()

  for (const file of files) {
    const sql = await readFile(join(scriptsDir, file), "utf8")
    // Split into statements terminated by COMMIT; ignore comments/blank chunks.
    const statements = sql
      .split(/;?\s*COMMIT\s*;/i)
      .map((s) => s.trim())
      .filter((s) => s && !/^(--.*\s*)*$/.test(s))

    console.log(`[v0] running ${file} (${statements.length} statement(s))`)
    for (const stmt of statements) {
      await pool.query(stmt)
    }
  }

  console.log("[v0] migrations complete")
  await pool.end()
}

main().catch((err) => {
  console.error("[v0] migration failed:", err)
  process.exit(1)
})
