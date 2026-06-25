import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { tenantQuerySchema } from "@/lib/validation"
import { ok, handleError } from "@/lib/api"
import type { TenantUsageSummary } from "@/lib/types"

export const dynamic = "force-dynamic"

// GET /api/summary/tenant?tenantId= — the tenant-level rollup.
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = tenantQuerySchema.parse({
      tenantId: req.nextUrl.searchParams.get("tenantId"),
    })
    const res = await query<TenantUsageSummary>(
      `SELECT tenant_id, total_cost, total_requests, total_tokens, version, updated_at
       FROM tenant_usage_summary WHERE tenant_id = $1`,
      [tenantId],
    )
    return ok(res.rows[0] ?? null)
  } catch (err) {
    return handleError(err)
  }
}
