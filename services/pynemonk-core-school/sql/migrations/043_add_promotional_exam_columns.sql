-- Migration: 043_add_promotional_exam_columns.sql
-- Description: Adds is_promotional and min_promotion_threshold columns to school.exam.

ALTER TABLE school.exam 
ADD COLUMN IF NOT EXISTS is_promotional BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS min_promotion_threshold NUMERIC(5,2) DEFAULT 40.00;

-- Unique partial index: Only allow one promotional final exam per academic year, per school (tenant).
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_promotional_exam_per_year
ON school.exam (tenant_id, academic_year_id)
WHERE (is_promotional = TRUE AND is_deleted = FALSE);
