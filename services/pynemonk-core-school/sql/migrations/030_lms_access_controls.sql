-- Migration: 030_lms_access_controls.sql
-- Description: Add access control configurations to lms_resource table for granular grade/role restrictions.

ALTER TABLE school.lms_resource 
ADD COLUMN IF NOT EXISTS access_level VARCHAR(50) DEFAULT 'public';

ALTER TABLE school.lms_resource 
ADD COLUMN IF NOT EXISTS grade_ids INTEGER[];
