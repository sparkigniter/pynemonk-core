-- Leave Management
CREATE TABLE IF NOT EXISTS school.leave_type (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_paid BOOLEAN DEFAULT TRUE,
    default_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS school.leave_application (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    staff_id INTEGER NOT NULL REFERENCES school.staff(id),
    leave_type_id INTEGER NOT NULL REFERENCES school.leave_type(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    approved_by INTEGER REFERENCES school.staff(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payroll System
CREATE TABLE IF NOT EXISTS school.salary_structure (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    staff_id INTEGER NOT NULL REFERENCES school.staff(id),
    base_salary DECIMAL(15,2) DEFAULT 0,
    allowances JSONB DEFAULT '[]', -- [{name: "HRA", amount: 2000}]
    deductions JSONB DEFAULT '[]', -- [{name: "PF", amount: 500}]
    payment_mode VARCHAR(50) DEFAULT 'bank_transfer',
    bank_name VARCHAR(100),
    account_number VARCHAR(100),
    ifsc_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS school.payslip (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    staff_id INTEGER NOT NULL REFERENCES school.staff(id),
    month INTEGER NOT NULL, -- 1-12
    year INTEGER NOT NULL,
    base_salary DECIMAL(15,2) NOT NULL,
    total_allowances DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    net_salary DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, generated, paid
    paid_at TIMESTAMP WITH TIME ZONE,
    accounting_entry_id INTEGER, -- Link to accounting journal entry
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
