import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { tenantQuerySchema } from "@/lib/validation"
import { ok, handleError } from "@/lib/api"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = tenantQuerySchema.parse({
      tenantId: req.nextUrl.searchParams.get("tenantId"),
    })
    const res = await query(
      `SELECT DATE_TRUNC('hour', created_at)::text        AS hour_ts,
              SUM(cost)::text                             AS total_cost,
              COUNT(*)::text                              AS total_requests,
              COALESCE(SUM(token_count), 0)::text         AS total_tokens
       FROM ledger_transactions
       WHERE tenant_id = $1
         AND created_at >= CURRENT_DATE
       GROUP BY DATE_TRUNC('hour', created_at)
       ORDER BY hour_ts ASC`,
      [tenantId],
    )
    return ok(res.rows)
  } catch (err) {
    return handleError(err)
  }
}
