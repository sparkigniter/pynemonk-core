-- Migration: 022_payment_integration_tables.sql
-- Description: Create accounting.payment_transaction table to track and audit online payment gateway attempts.

CREATE TABLE IF NOT EXISTS accounting.payment_transaction (
    id                     serial        NOT NULL PRIMARY KEY,
    tenant_id              int           NOT NULL REFERENCES auth.tenant(id),
    invoice_id             int           NOT NULL REFERENCES accounting.fee_invoice(id),
    amount                 numeric(12,2) NOT NULL,
    currency               varchar(10)   NOT NULL DEFAULT 'USD',
    gateway                varchar(50)   NOT NULL, -- 'stripe', 'razorpay', 'mock'
    gateway_reference      varchar(250)  UNIQUE,    -- session_id / payment_intent_id / transaction_ref
    status                 varchar(30)   NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
    error_message          text,
    metadata               jsonb,
    is_deleted             boolean       NOT NULL DEFAULT FALSE,
    created_at             timestamptz   NOT NULL DEFAULT NOW(),
    updated_at             timestamptz   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_txn_ref ON accounting.payment_transaction(gateway_reference);
CREATE INDEX IF NOT EXISTS idx_payment_txn_invoice ON accounting.payment_transaction(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_txn_tenant ON accounting.payment_transaction(tenant_id);
