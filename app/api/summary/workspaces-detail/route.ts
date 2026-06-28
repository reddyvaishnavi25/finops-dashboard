import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { daysQuerySchema } from "@/lib/validation"
import { ok, handleError } from "@/lib/api"

export const dynamic = "force-dynamic"

interface RawRow {
  workspace_name: string
  total_cost: string
  total_requests: string
  total_tokens: string
}

export async function GET(req: NextRequest) {
  try {
    const { tenantId, days } = daysQuerySchema.parse({
      tenantId: req.nextUrl.searchParams.get("tenantId"),
      days: req.nextUrl.searchParams.get("days") ?? undefined,
    })
    const res = await query<RawRow>(
      `SELECT w.workspace_name,
              SUM(lt.cost)::text                     AS total_cost,
              COUNT(*)::text                         AS total_requests,
              COALESCE(SUM(lt.token_count), 0)::text AS total_tokens
       FROM ledger_transactions lt
       JOIN workspaces w ON lt.workspace_id = w.workspace_id
       WHERE lt.tenant_id = $1
         AND lt.created_at >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY w.workspace_name
       ORDER BY SUM(lt.cost) DESC`,
      [tenantId, days],
    )
    return ok(res.rows as unknown as RawRow[])
  } catch (err) {
    return handleError(err)
  }
}
