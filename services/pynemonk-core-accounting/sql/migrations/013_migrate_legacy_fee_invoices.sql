-- Migration: Migrate legacy fee invoices to unified invoice table
-- Description: Ensures all existing student fee invoices are represented in the core accounting.invoice table.

-- 1. Ensure partners exist for all students who have fee invoices
INSERT INTO accounting.partner (tenant_id, name, type, external_ref_type, external_ref_id)
SELECT DISTINCT 
    fi.tenant_id, 
    s.first_name || ' ' || s.last_name, 
    'customer', 
    'student', 
    fi.student_id
FROM accounting.fee_invoice fi
JOIN school.student s ON fi.student_id = s.id
ON CONFLICT (tenant_id, external_ref_type, external_ref_id) DO NOTHING;

-- 2. Migrate invoices to the unified table
INSERT INTO accounting.invoice (
    tenant_id, partner_id, invoice_no, total_amount, discount_amount, tax_amount, 
    net_amount, paid_amount, due_amount, status, due_date, source_type, source_id, created_at, updated_at
)
SELECT 
    fi.tenant_id,
    p.id as partner_id,
    fi.invoice_no,
    fi.total_amount,
    fi.discount_amount,
    fi.tax_amount,
    fi.net_amount,
    fi.paid_amount,
    fi.due_amount,
    fi.status,
    fi.due_date,
    'fee' as source_type,
    fi.id as source_id, 
    fi.created_at,
    fi.updated_at
FROM accounting.fee_invoice fi
JOIN accounting.partner p ON fi.tenant_id = p.tenant_id AND p.external_ref_type = 'student' AND p.external_ref_id = fi.student_id
ON CONFLICT (tenant_id, invoice_no) DO NOTHING;

-- 3. Update school.fee_installment to point to the new unified invoice IDs
-- Note: accounting.fee_invoice.id is the same as school.fee_installment.id in the legacy system
UPDATE school.fee_installment inst
SET invoice_id = inv.id
FROM accounting.invoice inv
WHERE inv.source_type = 'fee' AND inv.source_id = inst.id;
