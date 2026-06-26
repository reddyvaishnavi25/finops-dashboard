import { NextResponse } from "next/server"
import { z } from "zod"
import { ConcurrencyConflictError } from "./db"

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init)
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status: 400 })
}

// Maps thrown errors to consistent HTTP responses.
export function handleError(err: unknown) {
  if (err instanceof z.ZodError) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", details: err.flatten() },
      { status: 400 },
    )
  }
  if (err instanceof ConcurrencyConflictError) {
    // Conflict could not be resolved after all retries.
    return NextResponse.json(
      { ok: false, error: "Concurrency conflict, please retry", attempts: err.attempts },
      { status: 409 },
    )
  }
  console.error("[v0] API error:", err)
  return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 })
}
