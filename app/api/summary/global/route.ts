import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { ok, handleError } from "@/lib/api"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest) {
  try {
    const [summaryRes, todayRes] = await Promise.all([
      query(
        `SELECT SUM(total_cost)::text     AS total_spend,
                SUM(total_requests)::text AS total_requests,
                SUM(total_tokens)::text   AS total_tokens,
                COUNT(tenant_id)::text    AS active_tenants
         FROM tenant_usage_summary`,
      ),
      query(
        `SELECT COALESCE(SUM(cost), 0)::text AS today_spend
         FROM ledger_transactions
         WHERE created_at >= CURRENT_DATE`,
      ),
    ])
    const row = (summaryRes.rows[0] ?? {}) as Record<string, string>
    const today = (todayRes.rows[0] ?? {}) as Record<string, string>
    return ok({ ...row, today_spend: today.today_spend ?? "0" })
  } catch (err) {
    return handleError(err)
  }
}
