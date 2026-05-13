-- ─────────────────────────────────────────────────────────────────────────────
-- Pynemonk Auth Module — Consolidated Seeder (Demo Data)
-- Purpose: Populates the database with initial tenants, users, and credentials.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
    v_package_id INT := (SELECT id FROM auth.package WHERE slug = 'premium');
    v_tenant_id INT;
    v_role_id_admin INT;
    v_role_id_teacher INT;
    v_role_id_accountant INT;
    v_role_id_sysadmin INT;
    v_user_id_sys INT;
    v_user_id_adm INT;
    v_user_id_tea INT;
    v_user_id_acc INT;
    v_password_hash TEXT := '$2b$12$Wbkdx61wwjKAQwohUBsGVe76p6K4Nxl/OfVhTXkU1b6lf6gXl5CYG'; -- password123
BEGIN
    -- 1. Create Demo Tenant
    INSERT INTO auth.tenant (name, slug, email, package_id)
    VALUES ('Demo Academy', 'demo', 'admin@demo.edu', v_package_id)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_tenant_id;

    -- 1.5 Update Role Templates (Ensure latest permissions)
    UPDATE auth.role_template SET data_scope = '["student:read","student:write","student.academic:read","student.academic:write","student.attendance:read","student.attendance:write","staff:read","staff:write","class:read","class:write","exam:read","exam:write","mark:read","mark:write","timetable:read","timetable:write","user:invite","user:deactivate","announcement:write","settings:read","settings:write","report:read","report:export","coa:read","journal:read","invoice:read","invoice:write","payment:read","payment:write","accounting:read"]'::jsonb WHERE slug = 'school_admin';
    UPDATE auth.role_template SET data_scope = '["student:read","student.academic:read","student.academic:write","student.attendance:read","student.attendance:write","class:read","assignment:read","assignment:write","exam:read","exam:write","mark:read","mark:write","report.class:read","teacher_note:read","teacher_note:write","timetable:read","staff:read","staff.academic:read"]'::jsonb WHERE slug = 'teacher';

    -- 2. Instantiate System Roles for Tenant
    INSERT INTO auth.role (tenant_id, slug, name, description, tier, is_system, data_scope)
    SELECT v_tenant_id, slug, name, description, tier, is_system, data_scope
    FROM auth.role_template
    ON CONFLICT (tenant_id, slug) WHERE is_deleted = FALSE DO UPDATE SET
        data_scope = EXCLUDED.data_scope;

    -- 3. Get Role IDs
    SELECT id INTO v_role_id_admin FROM auth.role WHERE slug = 'school_admin' AND tenant_id = v_tenant_id;
    SELECT id INTO v_role_id_teacher FROM auth.role WHERE slug = 'teacher' AND tenant_id = v_tenant_id;
    SELECT id INTO v_role_id_accountant FROM auth.role WHERE slug = 'accountant' AND tenant_id = v_tenant_id;
    SELECT id INTO v_role_id_sysadmin FROM auth.role WHERE slug = 'system_admin' AND tenant_id IS NULL;

    -- 4. Create System Admin (Global)
    INSERT INTO auth.user (email, role_id, tenant_id)
    VALUES ('vikas@sparkigniter.com', v_role_id_sysadmin, NULL)
    ON CONFLICT (email) DO UPDATE SET 
        role_id = EXCLUDED.role_id,
        tenant_id = EXCLUDED.tenant_id
    RETURNING id INTO v_user_id_sys;

    INSERT INTO auth.user_credential (user_id, password_hash, tenant_id)
    VALUES (v_user_id_sys, v_password_hash, NULL)
    ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

    INSERT INTO auth.user_role (user_id, role_id, is_primary)
    VALUES (v_user_id_sys, v_role_id_sysadmin, TRUE)
    ON CONFLICT (user_id, role_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

    -- 5. Create School Admin
    INSERT INTO auth.user (email, role_id, tenant_id)
    VALUES ('admin@demo.edu', v_role_id_admin, v_tenant_id)
    ON CONFLICT (email) DO UPDATE SET 
        role_id = EXCLUDED.role_id,
        tenant_id = EXCLUDED.tenant_id
    RETURNING id INTO v_user_id_adm;

    INSERT INTO auth.user_credential (user_id, password_hash, tenant_id)
    VALUES (v_user_id_adm, v_password_hash, v_tenant_id)
    ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

    INSERT INTO auth.user_role (user_id, role_id, is_primary)
    VALUES (v_user_id_adm, v_role_id_admin, TRUE)
    ON CONFLICT (user_id, role_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

    -- 6. Create Teacher
    INSERT INTO auth.user (email, role_id, tenant_id)
    VALUES ('teacher1@demo.edu', v_role_id_teacher, v_tenant_id)
    ON CONFLICT (email) DO UPDATE SET 
        role_id = EXCLUDED.role_id,
        tenant_id = EXCLUDED.tenant_id
    RETURNING id INTO v_user_id_tea;

    INSERT INTO auth.user_credential (user_id, password_hash, tenant_id)
    VALUES (v_user_id_tea, v_password_hash, v_tenant_id)
    ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

    INSERT INTO auth.user_role (user_id, role_id, is_primary)
    VALUES (v_user_id_tea, v_role_id_teacher, TRUE)
    ON CONFLICT (user_id, role_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

    -- 7. Create Accountant
    INSERT INTO auth.user (email, role_id, tenant_id)
    VALUES ('accountant@pynemonk.com', v_role_id_accountant, v_tenant_id)
    ON CONFLICT (email) DO UPDATE SET 
        role_id = EXCLUDED.role_id,
        tenant_id = EXCLUDED.tenant_id
    RETURNING id INTO v_user_id_acc;

    INSERT INTO auth.user_credential (user_id, password_hash, tenant_id)
    VALUES (v_user_id_acc, v_password_hash, v_tenant_id)
    ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

    INSERT INTO auth.user_role (user_id, role_id, is_primary)
    VALUES (v_user_id_acc, v_role_id_accountant, TRUE)
    ON CONFLICT (user_id, role_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;

    -- 8. Add Profile Data
    INSERT INTO auth.user_profile (user_id, tenant_id, first_name, last_name)
    VALUES 
        (v_user_id_sys, NULL, 'Vikas', 'System'),
        (v_user_id_adm, v_tenant_id, 'Demo', 'Admin'),
        (v_user_id_tea, v_tenant_id, 'Sarah', 'Teacher'),
        (v_user_id_acc, v_tenant_id, 'John', 'Accountant')
    ON CONFLICT (user_id) DO UPDATE SET 
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name;

    -- 9. Add Demo Settings
    INSERT INTO auth.tenant_setting (tenant_id, key, value, is_public)
    VALUES 
        (v_tenant_id, 'school_name', 'Demo Academy', TRUE),
        (v_tenant_id, 'academic_year', '2026-2027', TRUE),
        (v_tenant_id, 'currency', 'USD', TRUE)
    ON CONFLICT DO NOTHING;

    -- Final sync to ensure all roles for the new tenant are whitelisted
    PERFORM auth.proc_publish_iam_state();

    RAISE NOTICE 'Demo data seeded successfully.';
END $$;
