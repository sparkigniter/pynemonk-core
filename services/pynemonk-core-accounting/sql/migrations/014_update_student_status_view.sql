-- Migration: Update student financial status view to use unified invoices
-- Description: Redefines the view to pull from accounting.invoice (the unified table) 
-- instead of the legacy fee_invoice table.

CREATE OR REPLACE VIEW accounting.v_student_financial_status AS
SELECT 
    s.id as student_id,
    s.tenant_id,
    COALESCE(SUM(i.net_amount), 0) as total_invoiced,
    COALESCE(SUM(i.paid_amount), 0) as total_paid,
    COALESCE(SUM(i.due_amount), 0) as outstanding_balance,
    CASE 
        WHEN COUNT(i.id) = 0 THEN 'no_invoices'
        WHEN SUM(i.due_amount) <= 0 THEN 'paid'
        WHEN SUM(i.paid_amount) > 0 THEN 'partial'
        ELSE 'unpaid'
    END as financial_status
FROM school.student s
-- Link via the Unified Partner system
LEFT JOIN accounting.partner p ON p.tenant_id = s.tenant_id AND p.external_ref_type = 'student' AND p.external_ref_id = s.id
LEFT JOIN accounting.invoice i ON i.partner_id = p.id AND i.is_deleted = FALSE AND i.status != 'void'
GROUP BY s.id, s.tenant_id;
