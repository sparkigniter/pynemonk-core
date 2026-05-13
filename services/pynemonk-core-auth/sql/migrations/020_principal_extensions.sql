-- Migration: 020_principal_extensions.sql
-- Description: Grant Principal role template access to HR and Finance scopes for Leave Approvals and Payroll visibility.

DO $$
DECLARE
    v_principal_scopes JSONB;
BEGIN
    -- 1. Get current scopes for principal
    SELECT data_scope INTO v_principal_scopes 
    FROM auth.role_template 
    WHERE slug = 'principal' AND client_id IS NULL;

    -- 2. Add missing scopes if principal exists
    IF v_principal_scopes IS NOT NULL THEN
        -- Add staff:write for Leave Approvals
        IF NOT v_principal_scopes ? 'staff:write' THEN
            v_principal_scopes = v_principal_scopes || '["staff:write"]'::jsonb;
        END IF;

        -- Add accounting:read and accounting:write for Payroll visibility
        IF NOT v_principal_scopes ? 'accounting:read' THEN
            v_principal_scopes = v_principal_scopes || '["accounting:read"]'::jsonb;
        END IF;
        
        IF NOT v_principal_scopes ? 'accounting:write' THEN
            v_principal_scopes = v_principal_scopes || '["accounting:write"]'::jsonb;
        END IF;

        -- Update the template
        UPDATE auth.role_template 
        SET data_scope = v_principal_scopes 
        WHERE slug = 'principal' AND client_id IS NULL;
        
        -- Also update existing roles for active tenants (Sync)
        UPDATE auth.role
        SET data_scope = v_principal_scopes
        WHERE slug = 'principal';
    END IF;
END $$;
