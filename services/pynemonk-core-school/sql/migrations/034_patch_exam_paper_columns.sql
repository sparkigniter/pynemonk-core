-- Migration: Patch exam_paper columns
-- Description: Align school.exam_paper schema with codebase by renaming paper_date and adding passing_marks and room columns.

DO $$
BEGIN
    -- Rename paper_date to exam_date if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'school' 
          AND table_name = 'exam_paper' 
          AND column_name = 'paper_date'
    ) THEN
        ALTER TABLE school.exam_paper RENAME COLUMN paper_date TO exam_date;
    END IF;
END $$;

ALTER TABLE school.exam_paper ADD COLUMN IF NOT EXISTS exam_date DATE; -- Fallback if not renamed
ALTER TABLE school.exam_paper ADD COLUMN IF NOT EXISTS passing_marks NUMERIC(6,2) NOT NULL DEFAULT 35.00;
ALTER TABLE school.exam_paper ADD COLUMN IF NOT EXISTS room VARCHAR(50);
