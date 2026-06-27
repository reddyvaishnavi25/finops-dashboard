import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { tenantQuerySchema } from "@/lib/validation"
import { ok, handleError } from "@/lib/api"
import type { UsageTypeSummary } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = tenantQuerySchema.parse({
      tenantId: req.nextUrl.searchParams.get("tenantId"),
    })
    const res = await query<UsageTypeSummary>(
      `SELECT COALESCE(usage_type, 'unknown') AS usage_type,
              SUM(cost)::text                 AS total_cost,
              COUNT(*)::text                  AS total_requests
       FROM ledger_transactions
       WHERE tenant_id = $1
       GROUP BY usage_type
       ORDER BY SUM(cost) DESC`,
      [tenantId],
    )
    return ok(res.rows)
  } catch (err) {
    return handleError(err)
  }
}
