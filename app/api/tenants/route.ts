import { query } from "@/lib/db"
import { ok, handleError } from "@/lib/api"
import type { Tenant } from "@/lib/types"

export const dynamic = "force-dynamic"

// GET /api/tenants — list tenants (for the tenant switcher).
export async function GET() {
  try {
    const res = await query<Tenant>(
      `SELECT tenant_id, company_name, subscription_tier, created_at
       FROM tenants ORDER BY company_name`,
    )
    return ok(res.rows)
  } catch (err) {
    return handleError(err)
  }
}
