-- Migration: Seed Accountant User
-- Description: Creates a default accountant user for testing.

DO $$
DECLARE
    v_tenant_id INT := (SELECT id FROM auth.tenant LIMIT 1);
    v_role_id INT;
    v_user_id INT;
BEGIN
    -- 1. Get Accountant Role
    SELECT id INTO v_role_id FROM auth.role WHERE slug = 'accountant' AND tenant_id = v_tenant_id;
    
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Accountant role not found for tenant %', v_tenant_id;
    END IF;

    -- 2. Create User
    INSERT INTO auth.user (email, tenant_id, role_id)
    VALUES ('accountant@pynemonk.com', v_tenant_id, v_role_id)
    ON CONFLICT (email) DO UPDATE SET role_id = v_role_id
    RETURNING id INTO v_user_id;

    -- 3. Set Password (password123)
    DELETE FROM auth.user_credential WHERE user_id = v_user_id;
    INSERT INTO auth.user_credential (user_id, password_hash, tenant_id)
    VALUES (v_user_id, '$2b$12$Wbkdx61wwjKAQwohUBsGVe76p6K4Nxl/OfVhTXkU1b6lf6gXl5CYG', v_tenant_id);

    -- 4. Map User Role
    INSERT INTO auth.user_role (user_id, role_id, is_primary)
    VALUES (v_user_id, v_role_id, TRUE)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    RAISE NOTICE 'Accountant user created: accountant@pynemonk.com / Password123!';
END $$;
