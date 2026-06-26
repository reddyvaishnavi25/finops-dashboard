-- Ledger transactions: one row per billable usage event.
-- Relationships to tenants/workspaces enforced in app code (no FK in DSQL).
CREATE TABLE IF NOT EXISTS ledger_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    workspace_id UUID NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    service_provider VARCHAR(100) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    api_endpoint VARCHAR(255),
    usage_type VARCHAR(50),
    usage_quantity DECIMAL(20,4),
    model_name VARCHAR(100),
    token_count BIGINT,
    cost DECIMAL(12,6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMIT;
