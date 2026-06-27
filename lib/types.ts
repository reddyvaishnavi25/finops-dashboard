export interface Tenant {
  tenant_id: string
  company_name: string
  subscription_tier: string
  created_at: string
}

export interface Workspace {
  workspace_id: string
  tenant_id: string
  workspace_name: string
  created_at: string
}

export interface LedgerTransaction {
  transaction_id: string
  tenant_id: string
  workspace_id: string
  feature_name: string
  service_provider: string
  service_name: string
  api_endpoint: string | null
  usage_type: string | null
  // DECIMAL/BIGINT are returned as strings by pg; parse when doing math.
  usage_quantity: string | null
  model_name: string | null
  token_count: string | null
  cost: string
  created_at: string
}

export interface EndpointCostSummary {
  tenant_id: string
  workspace_id: string
  api_endpoint: string
  total_cost: string
  request_count: string
  total_tokens: string
  version: number
  updated_at: string
}

export interface TenantUsageSummary {
  tenant_id: string
  total_cost: string
  total_requests: string
  total_tokens: string
  version: number
  updated_at: string
}

export interface FeatureUsageSummary {
  tenant_id: string
  feature_name: string
  total_cost: string
  total_requests: string
  total_tokens: string
  version: number
  updated_at: string
}

export interface ProviderSummary {
  service_provider: string
  total_cost: string
  total_requests: string
  total_tokens: string
}

export interface DailySummary {
  day: string
  total_cost: string
  total_requests: string
  total_tokens: string
}

export interface AnomalyRow {
  service_provider: string
  day: string
  daily_cost: string
  avg_cost: string
  ratio: string
}

export interface UsageTypeSummary {
  usage_type: string
  total_cost: string
  total_requests: string
}

export interface TenantWithSummary extends Tenant {
  total_cost: string | null
  total_requests: string | null
  total_tokens: string | null
  last_activity: string | null
}
