-- ─────────────────────────────────────────────────────────────────────────────
-- Pynemonk Accounting — Payment Allocation Migration
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create payment_allocation table for Fees
CREATE TABLE IF NOT EXISTS accounting.fee_payment_allocation (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    payment_id      INTEGER NOT NULL REFERENCES accounting.fee_payment(id) ON DELETE CASCADE,
    invoice_id      INTEGER NOT NULL REFERENCES accounting.fee_invoice(id) ON DELETE CASCADE,
    amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add indices for performance
CREATE INDEX IF NOT EXISTS idx_fee_alloc_payment ON accounting.fee_payment_allocation(payment_id);
CREATE INDEX IF NOT EXISTS idx_fee_alloc_invoice ON accounting.fee_payment_allocation(invoice_id);
CREATE INDEX IF NOT EXISTS idx_fee_alloc_tenant ON accounting.fee_payment_allocation(tenant_id);

-- 3. Add audit columns to student if missing (for financial status caching if needed)
-- But user wants DERIVED truth, so we'll use a VIEW for reporting.

-- 4. Financial Status View
CREATE OR REPLACE VIEW accounting.v_student_financial_status AS
SELECT 
    s.id as student_id,
    s.tenant_id,
    COALESCE(SUM(i.net_amount), 0) as total_invoiced,
    COALESCE(SUM(a.amount), 0) as total_paid,
    COALESCE(SUM(i.net_amount), 0) - COALESCE(SUM(a.amount), 0) as outstanding_balance,
    CASE 
        WHEN COALESCE(SUM(i.net_amount), 0) = 0 THEN 'no_invoices'
        WHEN COALESCE(SUM(i.net_amount), 0) - COALESCE(SUM(a.amount), 0) <= 0 THEN 'paid'
        WHEN COALESCE(SUM(a.amount), 0) > 0 THEN 'partial'
        ELSE 'unpaid'
    END as financial_status
FROM school.student s
LEFT JOIN accounting.fee_invoice i ON s.id = i.student_id AND i.is_deleted = FALSE
LEFT JOIN accounting.fee_payment_allocation a ON i.id = a.invoice_id AND a.is_deleted = FALSE
GROUP BY s.id, s.tenant_id;
