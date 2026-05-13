-- Migration: 021_granular_hr_payroll_scopes.sql
-- Description: Define dedicated scopes for Leave Management and Payroll to ensure proper least-privilege access.

-- 1. Create the new granular scopes
INSERT INTO auth.scope (value, description)
VALUES 
    ('staff.leave:read', 'View own or staff leave applications'),
    ('staff.leave:write', 'Submit, approve, or reject leave applications'),
    ('staff.payroll:read', 'View staff salary structures and payslips'),
    ('staff.payroll:write', 'Manage salary structures and process payroll payments')
ON CONFLICT (value) DO NOTHING;

-- 2. Update role templates to include these granular scopes
DO $$
DECLARE
    v_scopes JSONB;
BEGIN
    -- Teacher: Can read/write their own leaves
    SELECT data_scope INTO v_scopes FROM auth.role_template WHERE slug = 'teacher' AND client_id IS NULL;
    IF v_scopes IS NOT NULL THEN
        UPDATE auth.role_template SET data_scope = v_scopes || '["staff.leave:read", "staff.leave:write"]'::jsonb WHERE slug = 'teacher' AND client_id IS NULL;
    END IF;

    -- Principal: Can read/write all leaves and payroll
    SELECT data_scope INTO v_scopes FROM auth.role_template WHERE slug = 'principal' AND client_id IS NULL;
    IF v_scopes IS NOT NULL THEN
        UPDATE auth.role_template SET data_scope = v_scopes || '["staff.leave:read", "staff.leave:write", "staff.payroll:read", "staff.payroll:write"]'::jsonb WHERE slug = 'principal' AND client_id IS NULL;
    END IF;

    -- School Admin: Can read/write leaves
    SELECT data_scope INTO v_scopes FROM auth.role_template WHERE slug = 'school_admin' AND client_id IS NULL;
    IF v_scopes IS NOT NULL THEN
        UPDATE auth.role_template SET data_scope = v_scopes || '["staff.leave:read", "staff.leave:write"]'::jsonb WHERE slug = 'school_admin' AND client_id IS NULL;
    END IF;

    -- Accountant: Full payroll access
    SELECT data_scope INTO v_scopes FROM auth.role_template WHERE slug = 'accountant' AND client_id IS NULL;
    IF v_scopes IS NOT NULL THEN
        UPDATE auth.role_template SET data_scope = v_scopes || '["staff.payroll:read", "staff.payroll:write"]'::jsonb WHERE slug = 'accountant' AND client_id IS NULL;
    END IF;

    -- Sync active roles for all tenants
    UPDATE auth.role r
    SET data_scope = rt.data_scope
    FROM auth.role_template rt
    WHERE r.slug = rt.slug AND rt.client_id IS NULL;
END $$;
