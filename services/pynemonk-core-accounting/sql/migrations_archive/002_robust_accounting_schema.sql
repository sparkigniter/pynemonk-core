-- Migration: Standard Accounting (COA & Journal Entries)
-- Description: Adds Chart of Accounts, Journal Entries, and Journal Items for a robust double-entry system.

-- 1. Account Types
CREATE TABLE IF NOT EXISTS accounting.account_type (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE, -- Asset, Liability, Equity, Revenue, Expense
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

-- 2. Chart of Accounts
CREATE TABLE IF NOT EXISTS accounting.chart_of_accounts (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    code            VARCHAR(20) NOT NULL, -- e.g., "1001", "2001"
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

-- 3. Journal Entry (Header)
CREATE TABLE IF NOT EXISTS accounting.journal_entry (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    entry_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_no    VARCHAR(100),
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'posted', -- draft, posted, void
    created_by      INTEGER REFERENCES auth.user(id),
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Journal Item (Double-entry lines)
CREATE TABLE IF NOT EXISTS accounting.journal_item (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    journal_entry_id INTEGER NOT NULL REFERENCES accounting.journal_entry(id) ON DELETE CASCADE,
    account_id      INTEGER NOT NULL REFERENCES accounting.chart_of_accounts(id),
    debit           NUMERIC(14,2) DEFAULT 0,
    credit          NUMERIC(14,2) DEFAULT 0,
    description     TEXT,
    partner_type    VARCHAR(50), -- student, staff, vendor
    partner_id      INTEGER,      -- ID from respective table
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_journal_item_values CHECK (debit >= 0 AND credit >= 0),
    CONSTRAINT chk_journal_item_not_both CHECK (NOT (debit > 0 AND credit > 0))
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_coa_tenant ON accounting.chart_of_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_tenant ON accounting.journal_entry(tenant_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_item_entry ON accounting.journal_item(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_item_account ON accounting.journal_item(account_id);
