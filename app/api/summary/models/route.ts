import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { tenantQuerySchema } from "@/lib/validation"
import { ok, handleError } from "@/lib/api"

export const dynamic = "force-dynamic"

interface RawRow {
  model_name: string
  total_cost: string
  total_requests: string
  total_tokens: string
}

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = tenantQuerySchema.parse({
      tenantId: req.nextUrl.searchParams.get("tenantId"),
    })
    const res = await query<RawRow>(
      `SELECT COALESCE(model_name, 'unknown')      AS model_name,
              SUM(cost)::text                      AS total_cost,
              COUNT(*)::text                       AS total_requests,
              COALESCE(SUM(token_count), 0)::text  AS total_tokens
       FROM ledger_transactions
       WHERE tenant_id = $1
         AND model_name IS NOT NULL
       GROUP BY model_name
       ORDER BY SUM(cost) DESC`,
      [tenantId],
    )
    return ok(res.rows as unknown as RawRow[])
  } catch (err) {
    return handleError(err)
  }
}
