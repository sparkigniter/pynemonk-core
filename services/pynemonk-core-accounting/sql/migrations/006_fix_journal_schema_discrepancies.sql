-- Migration: 006_fix_journal_schema_discrepancies.sql
-- Description: Adds missing columns to journal_entry and journal_item to align with JournalHelper logic.

-- 1. Update journal_entry
ALTER TABLE accounting.journal_entry 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES auth.user(id);

-- 2. Update journal_item (description already added in 005, but we'll use IF NOT EXISTS pattern here)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='accounting' AND table_name='journal_item' AND column_name='description') THEN
        ALTER TABLE accounting.journal_item ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='accounting' AND table_name='journal_item' AND column_name='partner_type') THEN
        ALTER TABLE accounting.journal_item ADD COLUMN partner_type VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='accounting' AND table_name='journal_item' AND column_name='partner_id') THEN
        ALTER TABLE accounting.journal_item ADD COLUMN partner_id INTEGER;
    END IF;
END $$;

-- 3. Indices for performance
CREATE INDEX IF NOT EXISTS idx_journal_item_partner ON accounting.journal_item (partner_type, partner_id);
