-- ─────────────────────────────────────────────────────────────────────────────
-- pynemonk-core-accounting : init.sql
-- PostgreSQL schema for the Accounting module.
-- All tables are tenant-scoped and use soft deletes.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS accounting;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tax Configuration  (GST / VAT per tenant)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.tax_config (
    id          serial        NOT NULL,
    tenant_id   int           NOT NULL REFERENCES auth.tenant(id),
    name        varchar(50)   NOT NULL,                -- "GST", "VAT"
    rate        numeric(5,2)  NOT NULL DEFAULT 0,      -- percentage
    is_inclusive BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    is_deleted  BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Fee Category  (tuition, transport, library, lab, sports …)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.fee_category (
    id          serial        NOT NULL,
    tenant_id   int           NOT NULL REFERENCES auth.tenant(id),
    name        varchar(100)  NOT NULL,
    description text,
    is_mandatory BOOLEAN      NOT NULL DEFAULT TRUE,
    is_deleted  BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_fee_category_tenant_name UNIQUE (tenant_id, name)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Fee Structure  (amount per class per academic year per category)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.fee_structure (
    id               serial         NOT NULL,
    tenant_id        int            NOT NULL REFERENCES auth.tenant(id),
    academic_year_id int            NOT NULL REFERENCES school.academic_year(id),
    classroom_id     int            REFERENCES school.classroom(id),  -- NULL = all classes
    fee_category_id  int            NOT NULL REFERENCES accounting.fee_category(id),
    amount           numeric(12,2)  NOT NULL,
    tax_config_id    int            REFERENCES accounting.tax_config(id),
    is_deleted       BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_fee_structure UNIQUE (academic_year_id, classroom_id, fee_category_id)
);

CREATE INDEX IF NOT EXISTS idx_fee_structure_year ON accounting.fee_structure (tenant_id, academic_year_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Fee Installment  (payment schedule: Q1 / Q2 / Q3 / Q4 / Monthly)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.fee_installment (
    id               serial         NOT NULL,
    tenant_id        int            NOT NULL REFERENCES auth.tenant(id),
    academic_year_id int            NOT NULL REFERENCES school.academic_year(id),
    name             varchar(50)    NOT NULL,   -- "Quarter 1", "June 2025"
    due_date         DATE           NOT NULL,
    late_fee_amount  numeric(10,2)  NOT NULL DEFAULT 0,
    sort_order       smallint       NOT NULL DEFAULT 1,
    is_deleted       BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_fee_installment_year ON accounting.fee_installment (tenant_id, academic_year_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Fee Discount  (scholarship, concession, staff ward reduction)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.fee_discount (
    id               serial        NOT NULL,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    student_id       int           NOT NULL REFERENCES school.student(id),
    academic_year_id int           NOT NULL REFERENCES school.academic_year(id),
    fee_category_id  int           REFERENCES accounting.fee_category(id),  -- NULL = all categories
    discount_type    varchar(20)   NOT NULL DEFAULT 'fixed',  -- fixed, percentage
    discount_value   numeric(10,2) NOT NULL,
    reason           text,
    approved_by      int           REFERENCES auth.user(id),
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_fee_discount_student ON accounting.fee_discount (student_id, academic_year_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Fee Invoice  (invoice raised per student per installment)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.fee_invoice (
    id               serial        NOT NULL,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    invoice_no       varchar(30)   NOT NULL,
    student_id       int           NOT NULL REFERENCES school.student(id),
    academic_year_id int           NOT NULL REFERENCES school.academic_year(id),
    installment_id   int           NOT NULL REFERENCES accounting.fee_installment(id),
    total_amount     numeric(12,2) NOT NULL,
    discount_amount  numeric(12,2) NOT NULL DEFAULT 0,
    tax_amount       numeric(12,2) NOT NULL DEFAULT 0,
    net_amount       numeric(12,2) NOT NULL,     -- total - discount + tax
    paid_amount      numeric(12,2) NOT NULL DEFAULT 0,
    due_amount       numeric(12,2) NOT NULL,     -- net - paid
    status           varchar(20)   NOT NULL DEFAULT 'unpaid',  -- unpaid, partial, paid, overdue, waived
    due_date         DATE          NOT NULL,
    pdf_url          varchar(500),
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_invoice_no_tenant UNIQUE (tenant_id, invoice_no),
    CONSTRAINT uq_invoice_student_installment UNIQUE (student_id, installment_id)
);

CREATE INDEX IF NOT EXISTS idx_invoice_student ON accounting.fee_invoice (student_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoice_status ON accounting.fee_invoice (tenant_id, status) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Fee Payment  (one invoice can have multiple partial payments)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.fee_payment (
    id                     serial        NOT NULL,
    tenant_id              int           NOT NULL REFERENCES auth.tenant(id),
    invoice_id             int           NOT NULL REFERENCES accounting.fee_invoice(id),
    amount                 numeric(12,2) NOT NULL,
    payment_method         varchar(30)   NOT NULL DEFAULT 'cash',  -- cash, upi, card, bank_transfer, cheque
    payment_gateway        varchar(50),                             -- razorpay, stripe, etc.
    payment_gateway_ref    varchar(200),                            -- gateway transaction ID
    payment_date           DATE          NOT NULL DEFAULT CURRENT_DATE,
    receipt_no             varchar(30),
    notes                  text,
    received_by            int           REFERENCES auth.user(id),
    is_deleted             BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_payment_invoice ON accounting.fee_payment (invoice_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_payment_date ON accounting.fee_payment (tenant_id, payment_date) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Expense Category
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.expense_category (
    id          serial        NOT NULL,
    tenant_id   int           NOT NULL REFERENCES auth.tenant(id),
    name        varchar(100)  NOT NULL,
    description text,
    is_deleted  BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_expense_category_tenant_name UNIQUE (tenant_id, name)
);

-- Seed default expense categories (applied per-tenant on first use via application logic)

-- ─────────────────────────────────────────────────────────────────────────────
-- Budget  (annual budget per category)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.budget (
    id                   serial        NOT NULL,
    tenant_id            int           NOT NULL REFERENCES auth.tenant(id),
    academic_year_id     int           NOT NULL REFERENCES school.academic_year(id),
    expense_category_id  int           NOT NULL REFERENCES accounting.expense_category(id),
    amount               numeric(14,2) NOT NULL,
    notes                text,
    is_deleted           BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_budget_year_category UNIQUE (tenant_id, academic_year_id, expense_category_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Expense  (operating expenses: utilities, supplies, maintenance …)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.expense (
    id                   serial        NOT NULL,
    tenant_id            int           NOT NULL REFERENCES auth.tenant(id),
    expense_category_id  int           NOT NULL REFERENCES accounting.expense_category(id),
    academic_year_id     int           NOT NULL REFERENCES school.academic_year(id),
    title                varchar(200)  NOT NULL,
    description          text,
    amount               numeric(12,2) NOT NULL,
    expense_date         DATE          NOT NULL,
    payment_method       varchar(30)   NOT NULL DEFAULT 'cash',
    reference_no         varchar(100),
    vendor_name          varchar(200),
    status               varchar(20)   NOT NULL DEFAULT 'pending',  -- pending, approved, rejected, paid
    requested_by         int           NOT NULL REFERENCES auth.user(id),
    approved_by          int           REFERENCES auth.user(id),    -- ← improvement
    approved_at          TIMESTAMPTZ,
    receipt_url          varchar(500),
    is_deleted           BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_expense_tenant_date ON accounting.expense (tenant_id, expense_date) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_expense_status ON accounting.expense (tenant_id, status) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Salary Component  (base, HRA, DA, Transport Allowance, PF deduction …)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.salary_component (
    id             serial        NOT NULL,
    tenant_id      int           NOT NULL REFERENCES auth.tenant(id),
    name           varchar(100)  NOT NULL,
    component_type varchar(20)   NOT NULL DEFAULT 'earning', -- earning, deduction
    calc_type      varchar(20)   NOT NULL DEFAULT 'fixed',   -- fixed, percentage
    is_taxable     BOOLEAN       NOT NULL DEFAULT FALSE,
    is_deleted     BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_salary_component_tenant_name UNIQUE (tenant_id, name)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Staff Salary  (monthly payroll record)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.staff_salary (
    id               serial        NOT NULL,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    staff_id         int           NOT NULL REFERENCES school.staff(id),
    academic_year_id int           NOT NULL REFERENCES school.academic_year(id),
    month            smallint      NOT NULL CHECK (month BETWEEN 1 AND 12),
    year             smallint      NOT NULL,
    gross_salary     numeric(12,2) NOT NULL,
    total_deductions numeric(12,2) NOT NULL DEFAULT 0,
    net_salary       numeric(12,2) NOT NULL,
    working_days     smallint,
    present_days     smallint,
    status           varchar(20)   NOT NULL DEFAULT 'draft',  -- draft, approved, paid
    paid_on          DATE,
    payment_ref      varchar(100),
    breakdown        jsonb         NOT NULL DEFAULT '{}',     -- component-wise amounts
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_staff_salary_month UNIQUE (staff_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_staff_salary_staff ON accounting.staff_salary (staff_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_staff_salary_period ON accounting.staff_salary (tenant_id, year, month) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Salary Slip  (generated payslip document)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.salary_slip (
    id             serial       NOT NULL,
    tenant_id      int          NOT NULL REFERENCES auth.tenant(id),
    salary_id      int          NOT NULL REFERENCES accounting.staff_salary(id),
    slip_no        varchar(30)  NOT NULL,
    pdf_url        varchar(500),                    -- ← improvement: link to generated PDF
    generated_at   TIMESTAMPTZ,
    is_deleted     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_salary_slip UNIQUE (salary_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Ledger  (double-entry bookkeeping — improvement)
-- Every fee payment / expense creates two ledger rows (debit + credit)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting.ledger (
    id             serial        NOT NULL,
    tenant_id      int           NOT NULL REFERENCES auth.tenant(id),
    entry_date     DATE          NOT NULL DEFAULT CURRENT_DATE,
    account_type   varchar(30)   NOT NULL,   -- income, expense, asset, liability
    account_name   varchar(100)  NOT NULL,
    entry_type     varchar(10)   NOT NULL CHECK (entry_type IN ('debit', 'credit')),
    amount         numeric(14,2) NOT NULL,
    ref_table      varchar(50),              -- fee_payment, expense, staff_salary
    ref_id         int,
    description    text,
    is_deleted     BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ledger_tenant_date ON accounting.ledger (tenant_id, entry_date) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_ledger_ref ON accounting.ledger (ref_table, ref_id) WHERE is_deleted = FALSE;
