-- Migration: 012_add_journal_metadata.sql
-- Description: Adds metadata column to journal_entry and ensures journal_item has consistent naming if needed.

ALTER TABLE accounting.journal_entry ADD COLUMN IF NOT EXISTS metadata JSONB;

-- We will NOT rename journal_entry_id to journal_id to avoid breaking JournalHelper.
-- Instead, we will fix GeneralLedgerService to use journal_entry_id.
