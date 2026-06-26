-- Tenants: top-level customer accounts.
-- DSQL note: no extensions; gen_random_uuid() is built in. No foreign keys.
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'enterprise',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMIT;
