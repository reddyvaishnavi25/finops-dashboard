import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { daysQuerySchema } from "@/lib/validation"
import { ok, handleError } from "@/lib/api"

export const dynamic = "force-dynamic"

interface RawRow {
  day: string
  service_provider: string
  daily_cost: string
}

export async function GET(req: NextRequest) {
  try {
    const { tenantId, days } = daysQuerySchema.parse({
      tenantId: req.nextUrl.searchParams.get("tenantId"),
      days: req.nextUrl.searchParams.get("days") ?? undefined,
    })
    const res = await query<RawRow>(
      `SELECT DATE(created_at)::text AS day,
              service_provider,
              SUM(cost)::text        AS daily_cost
       FROM ledger_transactions
       WHERE tenant_id = $1
         AND created_at >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY DATE(created_at), service_provider
       ORDER BY day ASC`,
      [tenantId, days],
    )

    // Pivot rows into { day, OpenAI: x, Anthropic: y, ... }
    const rows = res.rows as unknown as RawRow[]
    const map = new Map<string, Record<string, unknown>>()
    for (const { day, service_provider, daily_cost } of rows) {
      if (!map.has(day)) map.set(day, { day })
      map.get(day)![service_provider] = Number(daily_cost)
    }
    return ok([...map.values()])
  } catch (err) {
    return handleError(err)
  }
}
