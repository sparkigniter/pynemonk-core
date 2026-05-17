-- Migration: 035_patch_student_and_enrollment.sql
-- Description: Add missing grade_id to school.student and enrollment_date to school.student_enrollment.

-- 1. Add grade_id to school.student referencing school.grade(id)
ALTER TABLE school.student 
ADD COLUMN IF NOT EXISTS grade_id INTEGER REFERENCES school.grade(id);

-- 2. Add enrollment_date to school.student_enrollment defaulting to CURRENT_DATE
ALTER TABLE school.student_enrollment 
ADD COLUMN IF NOT EXISTS enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE;
