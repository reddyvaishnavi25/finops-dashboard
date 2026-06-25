import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { tenantQuerySchema } from "@/lib/validation"
import { ok, handleError } from "@/lib/api"
import type { FeatureUsageSummary } from "@/lib/types"

export const dynamic = "force-dynamic"

// GET /api/summary/features?tenantId= — per-feature usage breakdown.
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = tenantQuerySchema.parse({
      tenantId: req.nextUrl.searchParams.get("tenantId"),
    })
    const res = await query<FeatureUsageSummary>(
      `SELECT tenant_id, feature_name, total_cost, total_requests, total_tokens,
              version, updated_at
       FROM feature_usage_summary
       WHERE tenant_id = $1
       ORDER BY total_cost DESC`,
      [tenantId],
    )
    return ok(res.rows)
  } catch (err) {
    return handleError(err)
  }
}
