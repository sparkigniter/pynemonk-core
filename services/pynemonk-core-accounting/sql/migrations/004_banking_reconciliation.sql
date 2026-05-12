-- ─────────────────────────────────────────────────────────────────────────────
-- Pynemonk Accounting — Banking Reconciliation
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Bank Statement Transactions (Bank Feeds)
CREATE TABLE IF NOT EXISTS accounting.bank_transaction (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    bank_account_id INTEGER NOT NULL REFERENCES accounting.bank_account(id),
    transaction_date DATE NOT NULL,
    description     TEXT NOT NULL,
    amount          NUMERIC(14,2) NOT NULL,
    type            VARCHAR(10) NOT NULL CHECK (type IN ('debit', 'credit')),
    reference_no    VARCHAR(100),
    is_reconciled   BOOLEAN DEFAULT FALSE,
    journal_entry_id INTEGER REFERENCES accounting.journal_entry(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_tx_tenant ON accounting.bank_transaction(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_account ON accounting.bank_transaction(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_status ON accounting.bank_transaction(is_reconciled) WHERE is_reconciled = FALSE;
