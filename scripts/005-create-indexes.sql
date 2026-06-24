-- DSQL requires CREATE INDEX ASYNC and does NOT allow ASC/DESC ordering.
-- One index per transaction.
CREATE INDEX ASYNC IF NOT EXISTS idx_ledger_tenant_created
    ON ledger_transactions (tenant_id, created_at);
COMMIT;

CREATE INDEX ASYNC IF NOT EXISTS idx_ledger_feature
    ON ledger_transactions (feature_name, created_at);
COMMIT;

CREATE INDEX ASYNC IF NOT EXISTS idx_ledger_provider
    ON ledger_transactions (service_provider, created_at);
COMMIT;
