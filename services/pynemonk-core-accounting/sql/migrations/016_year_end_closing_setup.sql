-- Migration: 016_year_end_closing_setup.sql
-- Description: Sets up the necessary system mappings for year-end closing.

-- 1. Ensure a Retained Earnings account exists or can be mapped
-- We will use a standard key for the Retained Earnings account.
INSERT INTO accounting.system_account_mapping (tenant_id, mapping_key, account_id, category, label)
SELECT id, 'RETAINED_EARNINGS', 
    (SELECT id FROM accounting.chart_of_accounts WHERE tenant_id = auth.tenant.id AND (code = '3001' OR name ILIKE '%Retained Earnings%') LIMIT 1),
    'General Ledger', 'Retained Earnings Account (for Year-End)'
FROM auth.tenant
ON CONFLICT (tenant_id, mapping_key) DO UPDATE 
SET category = 'General Ledger', label = 'Retained Earnings Account (for Year-End)';

-- 2. Add an 'archived' status to journal_entry if not present
-- (Already handled by generic VARCHAR(20) in migration 001, but good to keep in mind)
