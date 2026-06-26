-- Pre-aggregated rollups. Each DDL is in its own transaction (one DDL per COMMIT).

-- Per-endpoint rollup, scoped to tenant + workspace.
CREATE TABLE IF NOT EXISTS endpoint_cost_summary (
    tenant_id UUID NOT NULL,
    workspace_id UUID NOT NULL,
    api_endpoint VARCHAR(255) NOT NULL,
    total_cost DECIMAL(18,6) NOT NULL DEFAULT 0,
    request_count BIGINT NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, workspace_id, api_endpoint)
);
COMMIT;

-- Per-tenant rollup.
CREATE TABLE IF NOT EXISTS tenant_usage_summary (
    tenant_id UUID PRIMARY KEY,
    total_cost DECIMAL(18,6) NOT NULL DEFAULT 0,
    total_requests BIGINT NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMIT;

-- Per-feature rollup, scoped to tenant.
CREATE TABLE IF NOT EXISTS feature_usage_summary (
    tenant_id UUID NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    total_cost DECIMAL(18,6) NOT NULL DEFAULT 0,
    total_requests BIGINT NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, feature_name)
);
COMMIT;
