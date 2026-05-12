-- ─────────────────────────────────────────────────────────────────────────────
-- Pynemonk Accounting — AP & Banking Migration
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Vendors (AP)
CREATE TABLE IF NOT EXISTS accounting.vendor (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(20),
    contact_person  VARCHAR(100),
    email           VARCHAR(100),
    phone           VARCHAR(20),
    address         TEXT,
    opening_balance NUMERIC(14,2) DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bank Accounts
CREATE TABLE IF NOT EXISTS accounting.bank_account (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    name            VARCHAR(100) NOT NULL,
    bank_name       VARCHAR(100),
    account_no      VARCHAR(50),
    branch          VARCHAR(100),
    gl_account_id   INTEGER REFERENCES accounting.chart_of_accounts(id),
    opening_balance NUMERIC(14,2) DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vendor Bills
CREATE TABLE IF NOT EXISTS accounting.vendor_bill (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    vendor_id       INTEGER NOT NULL REFERENCES accounting.vendor(id),
    bill_no         VARCHAR(50) NOT NULL,
    bill_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE,
    total_amount    NUMERIC(14,2) NOT NULL,
    paid_amount     NUMERIC(14,2) DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'open', -- draft, open, partial, paid, void
    journal_entry_id INTEGER REFERENCES accounting.journal_entry(id),
    notes           TEXT,
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bill Payments
CREATE TABLE IF NOT EXISTS accounting.bill_payment (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    vendor_id       INTEGER NOT NULL REFERENCES accounting.vendor(id),
    payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    amount          NUMERIC(14,2) NOT NULL,
    bank_account_id INTEGER REFERENCES accounting.bank_account(id),
    payment_method  VARCHAR(30) DEFAULT 'bank_transfer',
    reference_no    VARCHAR(50),
    journal_entry_id INTEGER REFERENCES accounting.journal_entry(id),
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_vendor_tenant ON accounting.vendor(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bank_tenant ON accounting.bank_account(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bill_vendor ON accounting.vendor_bill(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bill_tenant ON accounting.vendor_bill(tenant_id);

