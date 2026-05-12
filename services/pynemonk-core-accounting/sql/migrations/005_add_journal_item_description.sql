-- Migration: 005_add_journal_item_description.sql
-- Description: Adds a description (memo) column to journal items for better audit trails.

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='accounting' AND table_name='journal_item' AND column_name='description') THEN
        ALTER TABLE accounting.journal_item ADD COLUMN description TEXT;
    END IF;
END $$;


-- Index for description search if needed
CREATE INDEX IF NOT EXISTS idx_journal_item_description ON accounting.journal_item (description);
