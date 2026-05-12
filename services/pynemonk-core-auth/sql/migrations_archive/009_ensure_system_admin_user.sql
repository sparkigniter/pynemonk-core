-- Migration: 009_ensure_system_admin_user
-- Description: Creates the system admin user if it doesn't exist and sets the password.

DO $$
DECLARE
    v_user_id INT;
    v_role_id INT;
BEGIN
    -- 1. Get the system_admin role ID
    SELECT id INTO v_role_id FROM auth.role WHERE slug = 'system_admin' AND tenant_id IS NULL;
    
    IF v_role_id IS NULL THEN
        INSERT INTO auth.role (tenant_id, slug, name, description, tier, is_system)
        VALUES (NULL, 'system_admin', 'System Administrator', 'Platform-wide administrator', 0, TRUE)
        RETURNING id INTO v_role_id;
    END IF;

    -- 2. Ensure the user exists
    SELECT id INTO v_user_id FROM auth.user WHERE email = 'vikas@sparkigniter.com';
    
    IF v_user_id IS NULL THEN
        INSERT INTO auth.user (email, role_id, tenant_id)
        VALUES ('vikas@sparkigniter.com', v_role_id, NULL)
        RETURNING id INTO v_user_id;
    ELSE
        UPDATE auth.user SET role_id = v_role_id WHERE id = v_user_id;
    END IF;

    -- 3. Ensure the credential exists
    IF EXISTS (SELECT 1 FROM auth.user_credential WHERE user_id = v_user_id) THEN
        UPDATE auth.user_credential 
        SET password_hash = '$2b$12$Wbkdx61wwjKAQwohUBsGVe76p6K4Nxl/OfVhTXkU1b6lf6gXl5CYG' 
        WHERE user_id = v_user_id;
    ELSE
        INSERT INTO auth.user_credential (user_id, password_hash, tenant_id)
        VALUES (v_user_id, '$2b$12$Wbkdx61wwjKAQwohUBsGVe76p6K4Nxl/OfVhTXkU1b6lf6gXl5CYG', NULL);
    END IF;

    -- 4. Ensure the user_role assignment exists
    IF NOT EXISTS (SELECT 1 FROM auth.user_role WHERE user_id = v_user_id AND role_id = v_role_id) THEN
        INSERT INTO auth.user_role (user_id, role_id, is_primary)
        VALUES (v_user_id, v_role_id, TRUE);
    END IF;

END $$;
