import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { transactionsQuerySchema } from "@/lib/validation"
import { ok, handleError } from "@/lib/api"
import type { LedgerTransaction } from "@/lib/types"

export const dynamic = "force-dynamic"

// GET /api/transactions?tenantId=&limit= — recent ledger rows (live activity feed).
export async function GET(req: NextRequest) {
  try {
    const { tenantId, limit } = transactionsQuerySchema.parse({
      tenantId: req.nextUrl.searchParams.get("tenantId"),
      limit: req.nextUrl.searchParams.get("limit") ?? undefined,
    })
    const res = await query<LedgerTransaction>(
      `SELECT transaction_id, tenant_id, workspace_id, feature_name, service_provider,
              service_name, api_endpoint, usage_type, usage_quantity, model_name,
              token_count, cost, created_at
       FROM ledger_transactions
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [tenantId, limit],
    )
    return ok(res.rows)
  } catch (err) {
    return handleError(err)
  }
}
