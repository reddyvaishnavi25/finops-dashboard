import { query } from "@/lib/db"
import { ok, handleError } from "@/lib/api"
import type { TenantWithSummary } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const res = await query<TenantWithSummary>(
      `SELECT t.tenant_id,
              t.company_name,
              t.subscription_tier,
              t.created_at,
              tus.total_cost,
              tus.total_requests,
              tus.total_tokens,
              tus.updated_at AS last_activity
       FROM tenants t
       LEFT JOIN tenant_usage_summary tus USING (tenant_id)
       ORDER BY COALESCE(tus.total_cost, 0) DESC`,
    )
    return ok(res.rows)
  } catch (err) {
    return handleError(err)
  }
}
