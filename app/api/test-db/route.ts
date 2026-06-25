import { query } from "@/lib/db"
import { ok, handleError } from "@/lib/api"

export const dynamic = "force-dynamic"

// Connection health check: confirms we can reach Aurora DSQL and read counts.
export async function GET() {
  try {
    const res = await query<{ now: string }>("SELECT now() AS now")
    const counts = await query<{ table_name: string; n: string }>(
      `SELECT 'tenants' AS table_name, COUNT(*)::text AS n FROM tenants
       UNION ALL SELECT 'workspaces', COUNT(*)::text FROM workspaces
       UNION ALL SELECT 'ledger_transactions', COUNT(*)::text FROM ledger_transactions`,
    )
    return ok({
      connected: true,
      serverTime: res.rows[0]?.now,
      counts: Object.fromEntries(counts.rows.map((r) => [r.table_name, Number(r.n)])),
    })
  } catch (err) {
    return handleError(err)
  }
}
