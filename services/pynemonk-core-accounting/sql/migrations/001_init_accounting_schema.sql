-- ─────────────────────────────────────────────────────────────────────────────
-- Pynemonk Accounting Module — Consolidated Migration
-- Purpose: Defines the entire financial, fee management, and payroll schema.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS accounting;

-- 1. Configuration & Structure
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS accounting.account_type (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO accounting.account_type (name, normal_balance) VALUES
    ('Asset',     'debit'),
    ('Liability', 'credit'),
    ('Equity',    'credit'),
    ('Revenue',   'credit'),
    ('Expense',   'debit')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS accounting.chart_of_accounts (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    code            VARCHAR(20) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    account_type_id INTEGER NOT NULL REFERENCES accounting.account_type(id),
    parent_id       INTEGER REFERENCES accounting.chart_of_accounts(id),
    is_group        BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_coa_tenant_code UNIQUE (tenant_id, code)
);

-- 2. Fee Management
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS accounting.fee_category (
    id          serial NOT NULL PRIMARY KEY,
    tenant_id   int    NOT NULL REFERENCES auth.tenant(id),
    name        varchar(100) NOT NULL,
    is_deleted  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fee_category_name UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS accounting.fee_installment (
    id               serial         NOT NULL PRIMARY KEY,
    tenant_id        int            NOT NULL REFERENCES auth.tenant(id),
    academic_year_id int            NOT NULL REFERENCES school.academic_year(id),
    name             varchar(50)    NOT NULL,
    due_date         DATE           NOT NULL,
    late_fee_amount  numeric(10,2)  NOT NULL DEFAULT 0,
    sort_order       smallint       NOT NULL DEFAULT 1,
    is_deleted       BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounting.fee_invoice (
    id               serial        NOT NULL PRIMARY KEY,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    invoice_no       varchar(30)   NOT NULL,
    student_id       int           NOT NULL REFERENCES school.student(id),
    academic_year_id int           NOT NULL REFERENCES school.academic_year(id),
    installment_id   int           NOT NULL REFERENCES accounting.fee_installment(id),
    total_amount     numeric(12,2) NOT NULL,
    discount_amount  numeric(12,2) NOT NULL DEFAULT 0,
    tax_amount       numeric(12,2) NOT NULL DEFAULT 0,
    net_amount       numeric(12,2) NOT NULL,
    paid_amount      numeric(12,2) NOT NULL DEFAULT 0,
    due_amount       numeric(12,2) NOT NULL,
    status           varchar(20)   NOT NULL DEFAULT 'unpaid',
    due_date         DATE          NOT NULL,
    pdf_url          varchar(500),
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_invoice_no_tenant UNIQUE (tenant_id, invoice_no)
);

CREATE TABLE IF NOT EXISTS accounting.fee_payment (
    id                     serial        NOT NULL PRIMARY KEY,
    tenant_id              int           NOT NULL REFERENCES auth.tenant(id),
    invoice_id             int           NOT NULL REFERENCES accounting.fee_invoice(id),
    amount                 numeric(12,2) NOT NULL,
    payment_method         varchar(30)   NOT NULL DEFAULT 'cash',
    payment_date           DATE          NOT NULL DEFAULT CURRENT_DATE,
    receipt_no             varchar(30),
    is_deleted             BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 3. Payroll
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS accounting.staff_salary (
    id               serial        NOT NULL PRIMARY KEY,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    staff_id         int           NOT NULL REFERENCES school.staff(id),
    academic_year_id int           NOT NULL REFERENCES school.academic_year(id),
    month            smallint      NOT NULL CHECK (month BETWEEN 1 AND 12),
    year             smallint      NOT NULL,
    gross_salary     numeric(12,2) NOT NULL,
    total_deductions numeric(12,2) NOT NULL DEFAULT 0,
    net_salary       numeric(12,2) NOT NULL,
    status           varchar(20)   NOT NULL DEFAULT 'draft',
    paid_on          DATE,
    breakdown        jsonb         NOT NULL DEFAULT '{}',
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_staff_salary_month UNIQUE (staff_id, month, year)
);

-- 4. Journal Entries
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS accounting.journal_entry (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    entry_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_no    VARCHAR(100),
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'posted',
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounting.journal_item (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    journal_entry_id INTEGER NOT NULL REFERENCES accounting.journal_entry(id) ON DELETE CASCADE,
    account_id      INTEGER NOT NULL REFERENCES accounting.chart_of_accounts(id),
    debit           NUMERIC(14,2) DEFAULT 0,
    credit          NUMERIC(14,2) DEFAULT 0,
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_journal_item_values CHECK (debit >= 0 AND credit >= 0)
);

-- 5. Patches for Existing Tables
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ 
BEGIN
    -- fee_payment patches
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='accounting' AND table_name='fee_payment' AND column_name='student_id') THEN
        ALTER TABLE accounting.fee_payment ADD COLUMN student_id INT REFERENCES school.student(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='accounting' AND table_name='fee_payment' AND column_name='fee_structure_id') THEN
        ALTER TABLE accounting.fee_payment ADD COLUMN fee_structure_id INT REFERENCES accounting.fee_structure(id);
    END IF;
END $$;

-- Indices
CREATE INDEX IF NOT EXISTS idx_coa_tenant ON accounting.chart_of_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_tenant ON accounting.journal_entry(tenant_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_item_entry ON accounting.journal_item(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_payment_invoice ON accounting.fee_payment (invoice_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_staff_salary_staff ON accounting.staff_salary (staff_id) WHERE is_deleted = FALSE;
