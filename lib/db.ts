import { Pool, type ClientBase } from "pg"
import { DsqlSigner } from "@aws-sdk/dsql-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { fromNodeProviderChain } from "@aws-sdk/credential-providers"
import { attachDatabasePool } from "@vercel/functions"

// Environment-aware AWS credentials:
// - On Vercel/v0 a VERCEL_OIDC_TOKEN is present, so assume the project's role via OIDC.
// - Locally (e.g. a teammate in VSCode) there is no OIDC token, so fall back to the
//   standard AWS credential chain, which reads AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY.
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

export { pool }
