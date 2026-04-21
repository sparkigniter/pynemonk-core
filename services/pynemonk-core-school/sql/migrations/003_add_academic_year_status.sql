-- Migration: Add status column to academic_year table
-- Description: Supports 'planning', 'active', and 'archived' states for academic sessions.

ALTER TABLE school.academic_year 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'planning';

-- Ensure existing current year is marked as active
UPDATE school.academic_year 
SET status = 'active' 
WHERE is_current = TRUE;
