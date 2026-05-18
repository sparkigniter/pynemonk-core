-- Migration: 024_add_tenant_billing_status.sql
-- Description: Add billing_status column to tenant table for graceful suspension.

ALTER TABLE auth.tenant ADD COLUMN IF NOT EXISTS billing_status VARCHAR(30) DEFAULT 'active';
