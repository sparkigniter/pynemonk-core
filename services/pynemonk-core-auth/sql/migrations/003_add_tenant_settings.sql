-- Migration: Add Settings to Tenant
-- Description: Adds a JSONB settings column to the auth.tenant table to persist school-wide preferences.

ALTER TABLE auth.tenant ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';
