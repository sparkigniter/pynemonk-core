-- Migration: 007_add_bill_payment_allocation.sql
-- Description: Adds a junction table to link bill payments to specific vendor bills.

CREATE TABLE IF NOT EXISTS accounting.bill_payment_allocation (
    id          SERIAL PRIMARY KEY,
    tenant_id   INTEGER NOT NULL REFERENCES auth.tenant(id),
    payment_id  INTEGER NOT NULL REFERENCES accounting.bill_payment(id) ON DELETE CASCADE,
    bill_id     INTEGER NOT NULL REFERENCES accounting.vendor_bill(id) ON DELETE CASCADE,
    amount      NUMERIC(14,2) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_payment_allocation_bill ON accounting.bill_payment_allocation(bill_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocation_payment ON accounting.bill_payment_allocation(payment_id);
