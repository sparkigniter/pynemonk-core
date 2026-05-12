-- ─────────────────────────────────────────────────────────────────────────────
-- Pynemonk Accounting — System Account Mapping
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS accounting.system_account_mapping (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    mapping_key     VARCHAR(50) NOT NULL, -- e.g., 'SALARY_EXPENSE', 'ADMISSION_REVENUE'
    account_id      INTEGER NOT NULL REFERENCES accounting.chart_of_accounts(id),
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_mapping_tenant_key UNIQUE (tenant_id, mapping_key)
);

-- Seed default mappings if they don't exist (logic will be in Helper)
-- Common keys: 
-- 'SALARY_EXPENSE', 'SALARY_PAYABLE', 
-- 'ADMISSION_REVENUE', 'TUITION_REVENUE', 'FEE_RECEIVABLE',
-- 'CASH_ACCOUNT', 'BANK_ACCOUNT'

