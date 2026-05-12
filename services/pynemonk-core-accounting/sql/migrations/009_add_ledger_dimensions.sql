-- Migration: 009_add_ledger_dimensions.sql
-- Description: Adds dimensions like grade, school, and department to the ledger for better financial reporting.

-- 1. Add columns to journal_item
ALTER TABLE accounting.journal_item 
ADD COLUMN IF NOT EXISTS school_id INTEGER,
ADD COLUMN IF NOT EXISTS grade_id INTEGER,
ADD COLUMN IF NOT EXISTS department_id INTEGER,
ADD COLUMN IF NOT EXISTS cost_center_id INTEGER;

-- 2. Add transaction_type to journal_entry
ALTER TABLE accounting.journal_entry
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50);

-- 3. Add indices for dimension-based reporting
CREATE INDEX IF NOT EXISTS idx_journal_item_school ON accounting.journal_item (school_id);
CREATE INDEX IF NOT EXISTS idx_journal_item_grade ON accounting.journal_item (grade_id);
CREATE INDEX IF NOT EXISTS idx_journal_item_dept ON accounting.journal_item (department_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_type ON accounting.journal_entry (transaction_type);
