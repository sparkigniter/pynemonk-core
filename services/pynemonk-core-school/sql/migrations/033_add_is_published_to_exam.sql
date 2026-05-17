-- Migration: Add is_published to school.exam
-- Description: Adds is_published column to school.exam table for seeder and backend support.

ALTER TABLE school.exam ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;
