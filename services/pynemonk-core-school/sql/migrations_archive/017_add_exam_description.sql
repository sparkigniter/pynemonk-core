-- Migration: Add description to school.exam for global instructions
ALTER TABLE school.exam ADD COLUMN IF NOT EXISTS description TEXT;
