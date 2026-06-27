import { z } from "zod"

// Payload for a single cost/usage event ingested into the ledger.
export const ingestEntrySchema = z.object({
  tenant_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  feature_name: z.string().min(1).max(100),
  service_provider: z.string().min(1).max(100),
  service_name: z.string().min(1).max(100),
  api_endpoint: z.string().max(255).optional().nullable(),
  usage_type: z.string().max(50).optional().nullable(),
  usage_quantity: z.number().nonnegative().optional().nullable(),
  model_name: z.string().max(100).optional().nullable(),
  token_count: z.number().int().nonnegative().optional().nullable(),
  cost: z.number().nonnegative(),
})

export type IngestEntryInput = z.infer<typeof ingestEntrySchema>

// Batch ingest: an array of entries (capped to stay well under DSQL limits).
export const ingestBatchSchema = z.object({
  entries: z.array(ingestEntrySchema).min(1).max(1000),
})

export type IngestBatchInput = z.infer<typeof ingestBatchSchema>

// Common query param: tenant scope.
export const tenantQuerySchema = z.object({
  tenantId: z.string().uuid(),
})

export const transactionsQuerySchema = z.object({
  tenantId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const daysQuerySchema = z.object({
  tenantId: z.string().uuid(),
  days: z.coerce.number().int().min(1).max(90).default(30),
})

export const anomalyQuerySchema = z.object({
  tenantId: z.string().uuid(),
  days: z.coerce.number().int().min(1).max(90).default(30),
})
