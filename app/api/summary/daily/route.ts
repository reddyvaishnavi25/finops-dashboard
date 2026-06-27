import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { daysQuerySchema } from "@/lib/validation"
import { ok, handleError } from "@/lib/api"
import type { DailySummary } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { tenantId, days } = daysQuerySchema.parse({
      tenantId: req.nextUrl.searchParams.get("tenantId"),
      days: req.nextUrl.searchParams.get("days") ?? undefined,
    })
    const res = await query<DailySummary>(
      `SELECT DATE(created_at)::text                     AS day,
              SUM(cost)::text                            AS total_cost,
              COUNT(*)::text                             AS total_requests,
              COALESCE(SUM(token_count), 0)::text        AS total_tokens
       FROM ledger_transactions
       WHERE tenant_id = $1
         AND created_at >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY DATE(created_at)
       ORDER BY day ASC`,
      [tenantId, days],
    )
    return ok(res.rows)
  } catch (err) {
    return handleError(err)
  }
}
