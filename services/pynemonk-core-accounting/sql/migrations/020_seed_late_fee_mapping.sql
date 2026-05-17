-- Migration: 020_seed_late_fee_mapping.sql
-- Description: Adds system mapping keys for Late Fee Revenue and Accounts Receivable for automated fines.

INSERT INTO accounting.system_account_mapping (tenant_id, mapping_key, category, label)
SELECT id, 'LATE_FEE_INCOME', 'Fees', 'Late Fee Revenue Account'
FROM auth.tenant
ON CONFLICT (tenant_id, mapping_key) DO UPDATE 
SET category = 'Fees', label = 'Late Fee Revenue Account';

INSERT INTO accounting.system_account_mapping (tenant_id, mapping_key, category, label)
SELECT id, 'ACCOUNTS_RECEIVABLE', 'Invoicing', 'General Accounts Receivable'
FROM auth.tenant
ON CONFLICT (tenant_id, mapping_key) DO UPDATE 
SET category = 'Invoicing', label = 'General Accounts Receivable';
