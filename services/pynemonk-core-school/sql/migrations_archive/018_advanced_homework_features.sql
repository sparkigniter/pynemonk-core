-- Migration: Add advanced assignment features to school.homework
ALTER TABLE school.homework ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(30) DEFAULT 'homework';
ALTER TABLE school.homework ADD COLUMN IF NOT EXISTS submission_type VARCHAR(30) DEFAULT 'both';
ALTER TABLE school.homework ADD COLUMN IF NOT EXISTS max_attempts INT DEFAULT 1;
ALTER TABLE school.homework ADD COLUMN IF NOT EXISTS allow_late BOOLEAN DEFAULT FALSE;
ALTER TABLE school.homework ADD COLUMN IF NOT EXISTS auto_close BOOLEAN DEFAULT TRUE;
ALTER TABLE school.homework ADD COLUMN IF NOT EXISTS is_graded BOOLEAN DEFAULT TRUE;
ALTER TABLE school.homework ADD COLUMN IF NOT EXISTS rubric TEXT;

-- Update due_date to TIMESTAMPTZ to support time selection
ALTER TABLE school.homework ALTER COLUMN due_date TYPE TIMESTAMPTZ USING due_date::TIMESTAMPTZ;
