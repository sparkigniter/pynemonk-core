-- Migration: Add results_published to school.exam
ALTER TABLE school.exam ADD COLUMN IF NOT EXISTS results_published BOOLEAN DEFAULT FALSE;
