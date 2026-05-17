-- ─────────────────────────────────────────────────────────────────────────────
-- Invoice Line Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.invoice_line (
    id                  SERIAL PRIMARY KEY,
    tenant_id           INTEGER NOT NULL REFERENCES auth.tenant(id),
    invoice_id          INTEGER NOT NULL REFERENCES accounting.invoice(id) ON DELETE CASCADE,
    description         VARCHAR(255) NOT NULL,
    quantity            NUMERIC(12,4) NOT NULL DEFAULT 1.0000,
    unit_price          NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    amount              NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    ledger_account_id   INTEGER REFERENCES accounting.chart_of_accounts(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_line_invoice ON accounting.invoice_line(invoice_id);
