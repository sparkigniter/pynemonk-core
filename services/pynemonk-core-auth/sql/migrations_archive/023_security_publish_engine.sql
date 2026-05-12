-- Migration: 023_security_publish_engine.sql
-- Description: Implements the 'Publish' mechanism for security. 
-- Permissions can be staged in the Admin UI and then pushed to the live environment via this engine.

-- 1. Remove the automatic trigger (Transitioning to explicit 'Publish' workflow)
DROP TRIGGER IF EXISTS trg_sync_permissions_to_clients ON auth.role_permission;
DROP FUNCTION IF EXISTS auth.trg_func_sync_client_role_scope();

-- 2. Refine the Security Sync Procedure (The Publish Engine)
CREATE OR REPLACE FUNCTION auth.proc_publish_iam_state()
RETURNS VOID AS $$
DECLARE
    r_template RECORD;
    v_perm_key TEXT;
    v_client_id INT;
BEGIN
    -- A. Sync Templates to Master Scopes
    FOR r_template IN SELECT slug, data_scope FROM auth.role_template LOOP
        FOR v_perm_key IN SELECT jsonb_array_elements_text(r_template.data_scope) LOOP
            INSERT INTO auth.permission (key, description, tier)
            VALUES (v_perm_key, 'Auto-generated permission', 3)
            ON CONFLICT (key) DO NOTHING;

            INSERT INTO auth.scope (value, description)
            VALUES (v_perm_key, 'Auto-generated scope')
            ON CONFLICT (value) DO NOTHING;
        END LOOP;
    END LOOP;

    -- B. Propagate Staged Permissions to all Tenant Roles
    INSERT INTO auth.role_permission (tenant_id, role_id, permission_id)
    SELECT r.tenant_id, r.id, p.id
    FROM auth.role r
    JOIN auth.role_template rt ON r.slug = rt.slug
    CROSS JOIN LATERAL jsonb_array_elements_text(rt.data_scope) as scope_key
    JOIN auth.permission p ON p.key = scope_key
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- C. Sync to Live JWT Layer (client_role_scope) for Internal Clients
    -- This is the 'Publish' step that makes permissions active for Web/Mobile.
    FOR v_client_id IN SELECT id FROM auth.client WHERE is_internal = TRUE LOOP
        INSERT INTO auth.client_role_scope (client_id, role_id, scope_id)
        SELECT v_client_id, r.id, s.id
        FROM auth.role r
        JOIN auth.role_template rt ON r.slug = rt.slug
        CROSS JOIN LATERAL jsonb_array_elements_text(rt.data_scope) as scope_key
        JOIN auth.scope s ON s.value = scope_key
        ON CONFLICT (client_id, role_id, scope_id) DO UPDATE SET granted = TRUE;
    END LOOP;

    -- D. Metadata: Update a system setting to track last publish time
    -- (Assuming a general settings table exists or we can just log a notice)
    RAISE NOTICE 'IAM State published successfully.';
END;
$$ LANGUAGE plpgsql;
