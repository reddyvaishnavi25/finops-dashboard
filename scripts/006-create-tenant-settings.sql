CREATE TABLE IF NOT EXISTS tenant_settings (
    tenant_id       UUID PRIMARY KEY,
    monthly_budget  DECIMAL(18,2) NOT NULL DEFAULT 2000.00,
    alert_threshold DECIMAL(5,2)  NOT NULL DEFAULT 0.80,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMIT;
