import type { NextRequest } from "next/server"
import { ingestEntrySchema } from "@/lib/validation"
import { ingestLedgerEntry } from "@/lib/ingest"
import { tenantExists, workspaceBelongsToTenant } from "@/lib/db"
import { ok, badRequest, handleError } from "@/lib/api"

export const dynamic = "force-dynamic"

// POST /api/ingest — insert a single cost event + atomically update rollups.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const entry = ingestEntrySchema.parse(body)

    // App-layer referential integrity (DSQL has no foreign keys).
    if (!(await tenantExists(entry.tenant_id))) {
      return badRequest("Unknown tenant_id")
    }
    if (!(await workspaceBelongsToTenant(entry.workspace_id, entry.tenant_id))) {
      return badRequest("workspace_id does not belong to tenant_id")
    }

    const result = await ingestLedgerEntry(entry)
    return ok(
      {
        transaction_id: result.value.transaction_id,
        attempts: result.attempts,
        retries: result.retries,
      },
      { status: 201 },
    )
  } catch (err) {
    return handleError(err)
  }
}
