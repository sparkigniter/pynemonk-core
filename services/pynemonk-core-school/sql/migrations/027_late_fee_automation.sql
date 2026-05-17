-- ─────────────────────────────────────────────────────────────────────────────
-- Late Fee Automation Schema
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS accounting.late_fee_policy (
    id                  SERIAL PRIMARY KEY,
    tenant_id           INTEGER NOT NULL REFERENCES auth.tenant(id),
    name                VARCHAR(100) NOT NULL,
    fee_type            VARCHAR(20) NOT NULL CHECK (fee_type IN ('fixed', 'percentage')),
    amount              NUMERIC(12,2) NOT NULL,
    grace_period_days   INTEGER DEFAULT 0,
    frequency           VARCHAR(20) NOT NULL CHECK (frequency IN ('one-time', 'daily', 'monthly')),
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Link policy to installments
ALTER TABLE accounting.fee_installment ADD COLUMN IF NOT EXISTS late_fee_policy_id INTEGER REFERENCES accounting.late_fee_policy(id);

-- Track applied late fees on invoices
ALTER TABLE accounting.fee_invoice ADD COLUMN IF NOT EXISTS total_late_fee_applied NUMERIC(12,2) DEFAULT 0;
ALTER TABLE accounting.fee_invoice ADD COLUMN IF NOT EXISTS last_late_fee_applied_at TIMESTAMPTZ;

-- Add a comment to explain the audit trail
COMMENT ON COLUMN accounting.fee_invoice.total_late_fee_applied IS 'Cumulative late fees added to this invoice balance';
