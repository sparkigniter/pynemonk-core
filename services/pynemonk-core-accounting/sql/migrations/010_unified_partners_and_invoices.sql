-- Migration: Unified Partners and Invoices
-- Description: Introduces a generic Partner (Contact) system and a Unified Invoice table to decouple AR from Fee-specific schemas.

-- 1. Unified Partner Table
CREATE TABLE IF NOT EXISTS accounting.partner (
    id                  SERIAL PRIMARY KEY,
    tenant_id           INTEGER NOT NULL REFERENCES auth.tenant(id),
    name                VARCHAR(200) NOT NULL,
    email               VARCHAR(100),
    phone               VARCHAR(20),
    type                VARCHAR(20) DEFAULT 'customer', -- customer, vendor, student, employee
    external_ref_type   VARCHAR(50), -- 'student', 'staff', etc.
    external_ref_id     INTEGER,     -- ID from school.student, etc.
    is_active           BOOLEAN DEFAULT TRUE,
    is_deleted          BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_partner_external UNIQUE (tenant_id, external_ref_type, external_ref_id)
);

-- 2. Generic Invoice Table
CREATE TABLE IF NOT EXISTS accounting.invoice (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    partner_id      INTEGER NOT NULL REFERENCES accounting.partner(id),
    invoice_no      VARCHAR(50) NOT NULL,
    invoice_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE,
    total_amount    NUMERIC(14,2) NOT NULL,
    tax_amount      NUMERIC(14,2) DEFAULT 0,
    discount_amount NUMERIC(14,2) DEFAULT 0,
    net_amount      NUMERIC(14,2) NOT NULL,
    paid_amount     NUMERIC(14,2) DEFAULT 0,
    due_amount      NUMERIC(14,2) NOT NULL,
    status          VARCHAR(20) DEFAULT 'unpaid', -- unpaid, partial, paid, void
    source_type     VARCHAR(50), -- 'fee', 'admission', 'sale', 'manual'
    source_id       INTEGER,     -- ID from accounting.fee_invoice, etc. (for backward sync)
    notes           TEXT,
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_invoice_no UNIQUE (tenant_id, invoice_no)
);

-- 3. Migration of existing vendors to partners
INSERT INTO accounting.partner (tenant_id, name, email, phone, type, external_ref_type, external_ref_id, is_active, is_deleted, created_at)
SELECT tenant_id, name, email, phone, 'vendor', 'accounting_vendor', id, is_active, is_deleted, created_at
FROM accounting.vendor
ON CONFLICT DO NOTHING;

-- 4. Create indices
CREATE INDEX IF NOT EXISTS idx_partner_tenant ON accounting.partner(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_tenant ON accounting.invoice(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_partner ON accounting.invoice(partner_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON accounting.invoice(status);
