-- Migration: 015_refine_accounting_config.sql
-- Description: Refines accounting configuration by adding fiscal year end and standardizing system mapping keys.

-- 1. Add fiscal_year_end to accounting.settings
ALTER TABLE accounting.settings 
ADD COLUMN IF NOT EXISTS fiscal_year_end DATE;

-- 2. Create a fiscal_year table for better historical tracking and closing
CREATE TABLE IF NOT EXISTS accounting.fiscal_year (
    id              SERIAL PRIMARY KEY,
    tenant_id       INTEGER NOT NULL REFERENCES auth.tenant(id),
    name            VARCHAR(50) NOT NULL, -- e.g., 'FY 2024-25'
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          VARCHAR(20) DEFAULT 'open', -- open, closed, archived
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_fiscal_year_tenant_name UNIQUE (tenant_id, name)
);

-- 3. Add more descriptive columns to system_account_mapping for UI grouping
ALTER TABLE accounting.system_account_mapping
ALTER COLUMN account_id DROP NOT NULL,
ADD COLUMN IF NOT EXISTS category VARCHAR(50), -- 'Fees', 'Invoicing', 'Payables'
ADD COLUMN IF NOT EXISTS label VARCHAR(100);    -- 'Default Bank for Fees', 'Fee Revenue Account'

-- 4. Seed/Update standard keys with metadata
-- This ensures the UI can easily display these settings in the correct sections.

-- Fees Collection
INSERT INTO accounting.system_account_mapping (tenant_id, mapping_key, account_id, category, label)
SELECT id, 'FEE_COLLECTION_DEBIT', 
    (SELECT id FROM accounting.chart_of_accounts WHERE tenant_id = auth.tenant.id AND code = '1001' LIMIT 1), -- Dummy code, logic should be smarter
    'Fees', 'Default Bank/Cash for Collections'
FROM auth.tenant
ON CONFLICT (tenant_id, mapping_key) DO UPDATE 
SET category = 'Fees', label = 'Default Bank/Cash for Collections';

INSERT INTO accounting.system_account_mapping (tenant_id, mapping_key, account_id, category, label)
SELECT id, 'FEE_COLLECTION_CREDIT', 
    (SELECT id FROM accounting.chart_of_accounts WHERE tenant_id = auth.tenant.id AND code = '1005' LIMIT 1),
    'Fees', 'Student Accounts Receivable'
FROM auth.tenant
ON CONFLICT (tenant_id, mapping_key) DO UPDATE 
SET category = 'Fees', label = 'Student Accounts Receivable';

-- Invoice Creation
INSERT INTO accounting.system_account_mapping (tenant_id, mapping_key, account_id, category, label)
SELECT id, 'INVOICE_REVENUE', 
    (SELECT id FROM accounting.chart_of_accounts WHERE tenant_id = auth.tenant.id AND code = '4001' LIMIT 1),
    'Invoicing', 'Default Fee Revenue Account'
FROM auth.tenant
ON CONFLICT (tenant_id, mapping_key) DO UPDATE 
SET category = 'Invoicing', label = 'Default Fee Revenue Account';

-- Accounts Payable
INSERT INTO accounting.system_account_mapping (tenant_id, mapping_key, account_id, category, label)
SELECT id, 'AP_PAYABLE', 
    (SELECT id FROM accounting.chart_of_accounts WHERE tenant_id = auth.tenant.id AND code = '2001' LIMIT 1),
    'Payables', 'Vendor Accounts Payable'
FROM auth.tenant
ON CONFLICT (tenant_id, mapping_key) DO UPDATE 
SET category = 'Payables', label = 'Vendor Accounts Payable';
