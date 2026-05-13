-- Migration: 021_fee_management_system
-- Description: Implements a highly configurable fee management system linked to students and accounting

-- 1. Fee Groups (e.g., "Regular Academic Fees", "Hostel Fees", "Transport Fees")
CREATE TABLE IF NOT EXISTS school.fee_group (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Fee Heads (Specific components of a fee, e.g., "Tuition Fee", "Development Fee")
CREATE TABLE IF NOT EXISTS school.fee_head (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- For accounting mapping
    is_refundable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Fee Structure (Templates for fees assigned to Grades/Students)
CREATE TABLE IF NOT EXISTS school.fee_structure (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    academic_year_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Fee Structure Items (Linking Heads to Structures with amounts)
CREATE TABLE IF NOT EXISTS school.fee_structure_item (
    id SERIAL PRIMARY KEY,
    fee_structure_id INTEGER REFERENCES school.fee_structure(id) ON DELETE CASCADE,
    fee_head_id INTEGER REFERENCES school.fee_head(id),
    amount DECIMAL(15, 2) NOT NULL,
    due_date DATE,
    installment_name VARCHAR(100) -- e.g., "Term 1", "June"
);

-- 5. Student Fee Allocation (Assigning a structure to a specific student)
CREATE TABLE IF NOT EXISTS school.student_fee_allocation (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    fee_structure_id INTEGER REFERENCES school.fee_structure(id),
    academic_year_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, WAIVED, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, fee_structure_id, academic_year_id)
);

-- 6. Fee Installments (Tracking generated invoices for a student's allocation)
CREATE TABLE IF NOT EXISTS school.fee_installment (
    id SERIAL PRIMARY KEY,
    allocation_id INTEGER REFERENCES school.student_fee_allocation(id) ON DELETE CASCADE,
    fee_structure_item_id INTEGER REFERENCES school.fee_structure_item(id),
    invoice_id INTEGER, -- Reference to accounting.invoice
    amount_due DECIMAL(15, 2) NOT NULL,
    amount_paid DECIMAL(15, 2) DEFAULT 0,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'UNPAID', -- UNPAID, PARTIAL, PAID, VOID
    last_payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Fee Discounts/Waivers
CREATE TABLE IF NOT EXISTS school.fee_discount (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- PERCENTAGE, FIXED
    value DECIMAL(15, 2) NOT NULL,
    reason TEXT
);

CREATE TABLE IF NOT EXISTS school.student_fee_discount (
    id SERIAL PRIMARY KEY,
    allocation_id INTEGER REFERENCES school.student_fee_allocation(id) ON DELETE CASCADE,
    fee_discount_id INTEGER REFERENCES school.fee_discount(id),
    applied_on_head_id INTEGER REFERENCES school.fee_head(id), -- NULL means global discount
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_fee_alloc_student ON school.student_fee_allocation(student_id);
CREATE INDEX idx_fee_inst_invoice ON school.fee_installment(invoice_id);
