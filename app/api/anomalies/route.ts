import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { anomalyQuerySchema } from "@/lib/validation"
import { ok, handleError } from "@/lib/api"
import type { AnomalyRow } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { tenantId, days } = anomalyQuerySchema.parse({
      tenantId: req.nextUrl.searchParams.get("tenantId"),
      days: req.nextUrl.searchParams.get("days") ?? undefined,
    })
    const res = await query<AnomalyRow>(
      `WITH daily AS (
         SELECT DATE(created_at)::text AS day,
                service_provider,
                SUM(cost)              AS daily_cost
         FROM ledger_transactions
         WHERE tenant_id = $1
           AND created_at >= NOW() - ($2 || ' days')::INTERVAL
         GROUP BY DATE(created_at), service_provider
       ),
       provider_avg AS (
         SELECT service_provider,
                AVG(daily_cost) AS avg_cost
         FROM daily
         GROUP BY service_provider
       )
       SELECT d.service_provider,
              d.day,
              d.daily_cost::text,
              pa.avg_cost::text,
              (d.daily_cost / NULLIF(pa.avg_cost, 0))::text AS ratio
       FROM daily d
       JOIN provider_avg pa USING (service_provider)
       WHERE d.daily_cost > pa.avg_cost * 2
       ORDER BY d.daily_cost DESC
       LIMIT 20`,
      [tenantId, days],
    )
    return ok(res.rows)
  } catch (err) {
    return handleError(err)
  }
}
