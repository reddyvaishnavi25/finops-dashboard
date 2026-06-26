import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { tenantQuerySchema } from "@/lib/validation"
import { ok, handleError } from "@/lib/api"
import type { EndpointCostSummary } from "@/lib/types"

export const dynamic = "force-dynamic"

// GET /api/summary/endpoints?tenantId= — per-endpoint cost breakdown.
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = tenantQuerySchema.parse({
      tenantId: req.nextUrl.searchParams.get("tenantId"),
    })
    const res = await query<EndpointCostSummary>(
      `SELECT tenant_id, workspace_id, api_endpoint, total_cost, request_count,
              total_tokens, version, updated_at
       FROM endpoint_cost_summary
       WHERE tenant_id = $1
       ORDER BY total_cost DESC`,
      [tenantId],
    )
    return ok(res.rows)
  } catch (err) {
    return handleError(err)
  }
}
