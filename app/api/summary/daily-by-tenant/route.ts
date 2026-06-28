import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { daysOnlySchema } from "@/lib/validation"
import { ok, handleError } from "@/lib/api"

export const dynamic = "force-dynamic"

interface RawRow {
  day: string
  company_name: string
  daily_cost: string
}

export async function GET(req: NextRequest) {
  try {
    const { days } = daysOnlySchema.parse({
      days: req.nextUrl.searchParams.get("days") ?? undefined,
    })
    const res = await query<RawRow>(
      `SELECT DATE(lt.created_at)::text AS day,
              t.company_name,
              SUM(lt.cost)::text        AS daily_cost
       FROM ledger_transactions lt
       JOIN tenants t ON lt.tenant_id = t.tenant_id
       WHERE lt.created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY DATE(lt.created_at), t.company_name
       ORDER BY day ASC`,
      [days],
    )

    const rows = res.rows as unknown as RawRow[]

    // Collect all distinct tenant names across the full result set so every
    // tenant gets a key on every day (zero-filled). This ensures all 4 lines
    // are always drawn regardless of which day a tenant first appears.
    const allTenants = [...new Set(rows.map(r => r.company_name))]

    const map = new Map<string, Record<string, unknown>>()
    for (const { day, company_name, daily_cost } of rows) {
      if (!map.has(day)) {
        const entry: Record<string, unknown> = { day }
        for (const name of allTenants) entry[name] = 0
        map.set(day, entry)
      }
      map.get(day)![company_name] = Number(daily_cost)
    }
    return ok([...map.values()])
  } catch (err) {
    return handleError(err)
  }
}
