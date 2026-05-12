-- Migration: Accounting Permissions & Role Mappings
-- Description: Adds permissions for Chart of Accounts, Journal Entries, and Invoices, and maps them to appropriate roles.

-- 1. Insert New Permissions
INSERT INTO auth.permission (key, description, tier, is_audited)
VALUES
    ('coa:read',        'View Chart of Accounts', 2, FALSE),
    ('coa:write',       'Manage Chart of Accounts', 2, TRUE),
    ('journal:read',    'View Journal Entries and Ledger', 2, FALSE),
    ('journal:write',   'Post Journal Entries', 2, TRUE),
    ('invoice:read',    'View Fee Invoices', 2, FALSE),
    ('invoice:write',   'Manage/Generate Fee Invoices', 2, TRUE),
    ('payment:read',    'View Fee Payments', 2, FALSE),
    ('payment:write',   'Record Fee Payments', 2, TRUE),
    ('accounting:read', 'General access to accounting module', 2, FALSE)
ON CONFLICT (key) DO NOTHING;

-- 1b. Insert into auth.scope (used for Client Whitelisting)
INSERT INTO auth.scope (value, description)
VALUES
    ('coa:read',        'View Chart of Accounts'),
    ('coa:write',       'Manage Chart of Accounts'),
    ('journal:read',    'View Journal Entries and Ledger'),
    ('journal:write',   'Post Journal Entries'),
    ('invoice:read',    'View Fee Invoices'),
    ('invoice:write',   'Manage/Generate Fee Invoices'),
    ('payment:read',    'View Fee Payments'),
    ('payment:write',   'Record Fee Payments'),
    ('accounting:read', 'General access to accounting module')
ON CONFLICT (value) DO NOTHING;

-- 2. Map Permissions to Roles
-- Roles to map: owner (0), school_admin (2), accountant (2), principal (1)

DO $$
DECLARE
    p_coa_r INT := (SELECT id FROM auth.permission WHERE key = 'coa:read');
    p_coa_w INT := (SELECT id FROM auth.permission WHERE key = 'coa:write');
    p_jrnl_r INT := (SELECT id FROM auth.permission WHERE key = 'journal:read');
    p_jrnl_w INT := (SELECT id FROM auth.permission WHERE key = 'journal:write');
    p_inv_r INT := (SELECT id FROM auth.permission WHERE key = 'invoice:read');
    p_inv_w INT := (SELECT id FROM auth.permission WHERE key = 'invoice:write');
    p_pay_r INT := (SELECT id FROM auth.permission WHERE key = 'payment:read');
    p_pay_w INT := (SELECT id FROM auth.permission WHERE key = 'payment:write');
    p_acc_r INT := (SELECT id FROM auth.permission WHERE key = 'accounting:read');
    
    r_owner_id INT;
    r_admin_id INT;
    r_acc_id INT;
    r_prin_id INT;
    t_id INT;
BEGIN
    FOR t_id IN (SELECT id FROM auth.tenant) LOOP
        -- Get role IDs for this tenant
        r_owner_id := (SELECT id FROM auth.role WHERE tenant_id = t_id AND slug = 'owner');
        r_admin_id := (SELECT id FROM auth.role WHERE tenant_id = t_id AND slug = 'school_admin');
        r_acc_id := (SELECT id FROM auth.role WHERE tenant_id = t_id AND slug = 'accountant');
        r_prin_id := (SELECT id FROM auth.role WHERE tenant_id = t_id AND slug = 'principal');

        -- Owner: Everything
        IF r_owner_id IS NOT NULL THEN
            INSERT INTO auth.role_permission (tenant_id, role_id, permission_id) VALUES 
            (t_id, r_owner_id, p_coa_r), (t_id, r_owner_id, p_coa_w), 
            (t_id, r_owner_id, p_jrnl_r), (t_id, r_owner_id, p_jrnl_w),
            (t_id, r_owner_id, p_inv_r), (t_id, r_owner_id, p_inv_w),
            (t_id, r_owner_id, p_pay_r), (t_id, r_owner_id, p_pay_w),
            (t_id, r_owner_id, p_acc_r) ON CONFLICT DO NOTHING;
        END IF;

        -- Accountant: Everything in accounting
        IF r_acc_id IS NOT NULL THEN
            INSERT INTO auth.role_permission (tenant_id, role_id, permission_id) VALUES 
            (t_id, r_acc_id, p_coa_r), (t_id, r_acc_id, p_coa_w), 
            (t_id, r_acc_id, p_jrnl_r), (t_id, r_acc_id, p_jrnl_w),
            (t_id, r_acc_id, p_inv_r), (t_id, r_acc_id, p_inv_w),
            (t_id, r_acc_id, p_pay_r), (t_id, r_acc_id, p_pay_w),
            (t_id, r_acc_id, p_acc_r) ON CONFLICT DO NOTHING;
        END IF;

        -- School Admin: Most things
        IF r_admin_id IS NOT NULL THEN
            INSERT INTO auth.role_permission (tenant_id, role_id, permission_id) VALUES 
            (t_id, r_admin_id, p_coa_r), (t_id, r_admin_id, p_jrnl_r), 
            (t_id, r_admin_id, p_inv_r), (t_id, r_admin_id, p_inv_w),
            (t_id, r_admin_id, p_pay_r), (t_id, r_admin_id, p_pay_w),
            (t_id, r_admin_id, p_acc_r) ON CONFLICT DO NOTHING;
        END IF;

        -- Principal: Read access
        IF r_prin_id IS NOT NULL THEN
            INSERT INTO auth.role_permission (tenant_id, role_id, permission_id) VALUES 
            (t_id, r_prin_id, p_coa_r), (t_id, r_prin_id, p_jrnl_r), 
            (t_id, r_prin_id, p_inv_r), (t_id, r_prin_id, p_pay_r),
            (t_id, r_prin_id, p_acc_r) ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- 3. Sync Internal Client Scopes (Whitelist)
SELECT auth.proc_sync_internal_client_scopes();

-- 4. Sync Client-Role-Scope intersections (The New Source of Truth for Login)
-- This ensures that for all internal clients, the roles have access to the new accounting scopes.
INSERT INTO auth.client_role_scope (client_id, role_id, scope_id)
SELECT c.id, rp.role_id, s.id
FROM auth.role_permission rp
JOIN auth.permission p ON rp.permission_id = p.id
JOIN auth.scope s ON p.key = s.value
CROSS JOIN auth.client c
WHERE c.is_internal = TRUE
  AND p.key IN ('coa:read', 'coa:write', 'journal:read', 'journal:write', 'invoice:read', 'invoice:write', 'payment:read', 'payment:write', 'accounting:read', 'settings:read', 'student:read')
ON CONFLICT (client_id, role_id, scope_id) DO NOTHING;
