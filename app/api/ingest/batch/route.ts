import type { NextRequest } from "next/server"
import { ingestBatchSchema } from "@/lib/validation"
import { ingestLedgerEntry } from "@/lib/ingest"
import { ok, handleError } from "@/lib/api"
import { ConcurrencyConflictError } from "@/lib/db"

export const dynamic = "force-dynamic"

// POST /api/ingest/batch — fire many ingests concurrently. Each entry is its own
// atomic transaction with OCC retry, so writes hitting the same summary rows
// will conflict and be retried. We report aggregate conflict/retry stats — this
// is what demonstrates Aurora DSQL's concurrent write behavior.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { entries } = ingestBatchSchema.parse(body)

    const started = Date.now()
    const results = await Promise.allSettled(entries.map((e) => ingestLedgerEntry(e)))

    let succeeded = 0
    let failed = 0
    let totalRetries = 0
    let conflictsExhausted = 0

    for (const r of results) {
      if (r.status === "fulfilled") {
        succeeded++
        totalRetries += r.value.retries
      } else {
        failed++
        if (r.reason instanceof ConcurrencyConflictError) conflictsExhausted++
      }
    }

    return ok({
      requested: entries.length,
      succeeded,
      failed,
      totalRetries, // conflicts that were detected and successfully retried
      conflictsExhausted, // conflicts that exhausted all retries
      durationMs: Date.now() - started,
    })
  } catch (err) {
    return handleError(err)
  }
}
