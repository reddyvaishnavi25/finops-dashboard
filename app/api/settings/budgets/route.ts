import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { tenantExists } from "@/lib/db"
import { budgetUpsertSchema } from "@/lib/validation"
import { ok, handleError } from "@/lib/api"
import type { TenantBudgetRow } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const res = await query<TenantBudgetRow>(
      `SELECT t.tenant_id,
              t.company_name,
              t.subscription_tier,
              tus.total_cost,
              tus.total_requests,
              tus.total_tokens,
              tus.updated_at  AS last_activity,
              ts.monthly_budget,
              ts.alert_threshold
       FROM tenants t
       LEFT JOIN tenant_usage_summary  tus USING (tenant_id)
       LEFT JOIN tenant_settings       ts  USING (tenant_id)
       ORDER BY t.company_name`,
    )
    return ok(res.rows)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = budgetUpsertSchema.parse(body)

    if (!(await tenantExists(input.tenant_id))) {
      return Response.json({ ok: false, error: "Unknown tenant_id" }, { status: 400 })
    }

    const existing = await query(
      `SELECT 1 FROM tenant_settings WHERE tenant_id = $1`,
      [input.tenant_id],
    )

    if (existing.rowCount && existing.rowCount > 0) {
      await query(
        `UPDATE tenant_settings
            SET monthly_budget  = $2,
                alert_threshold = $3,
                updated_at      = CURRENT_TIMESTAMP
          WHERE tenant_id = $1`,
        [input.tenant_id, input.monthly_budget.toFixed(2), input.alert_threshold.toFixed(4)],
      )
    } else {
      await query(
        `INSERT INTO tenant_settings (tenant_id, monthly_budget, alert_threshold)
         VALUES ($1, $2, $3)`,
        [input.tenant_id, input.monthly_budget.toFixed(2), input.alert_threshold.toFixed(4)],
      )
    }

    return ok({ tenant_id: input.tenant_id, saved: true })
  } catch (err) {
    return handleError(err)
  }
}
