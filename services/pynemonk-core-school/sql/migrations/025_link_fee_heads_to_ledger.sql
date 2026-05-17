-- Migration: 025_link_fee_heads_to_ledger
-- Description: Allows mapping specific fee heads to General Ledger revenue accounts

ALTER TABLE school.fee_head 
ADD COLUMN IF NOT EXISTS ledger_account_id INTEGER;

COMMENT ON COLUMN school.fee_head.ledger_account_id IS 'References accounting.chart_of_accounts(id) for revenue recognition';
