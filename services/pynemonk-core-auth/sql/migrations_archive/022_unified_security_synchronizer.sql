-- Migration: 022_unified_security_synchronizer.sql
-- Description: Implements a single source of truth (SSOT) for security. 
-- Role Templates are now the master source for all tenant permissions and client whitelisting.

-- 1. Update Role Templates to include Accounting Permissions
UPDATE auth.role_template 
SET data_scope = data_scope || '["coa:read", "coa:write", "journal:read", "journal:write", "invoice:read", "invoice:write", "payment:read", "payment:write", "accounting:read", "settings:read", "student:read"]'::jsonb
WHERE slug IN ('owner', 'accountant');

UPDATE auth.role_template 
SET data_scope = data_scope || '["coa:read", "journal:read", "invoice:read", "invoice:write", "payment:read", "payment:write", "accounting:read", "settings:read", "student:read"]'::jsonb
WHERE slug = 'school_admin';

UPDATE auth.role_template 
SET data_scope = data_scope || '["coa:read", "journal:read", "invoice:read", "payment:read", "accounting:read", "settings:read", "student:read"]'::jsonb
WHERE slug IN ('principal', 'vice_principal');

-- 2. Create the Unified Synchronizer Procedure
CREATE OR REPLACE FUNCTION auth.sync_security_state()
RETURNS VOID AS $$
DECLARE
    r_template RECORD;
    v_perm_key TEXT;
    v_client_id INT;
BEGIN
    -- A. Ensure all Template Scopes exist in 'auth.permission' and 'auth.scope'
    FOR r_template IN SELECT slug, data_scope FROM auth.role_template LOOP
        FOR v_perm_key IN SELECT jsonb_array_elements_text(r_template.data_scope) LOOP
            
            -- Ensure it exists in auth.permission
            INSERT INTO auth.permission (key, description, tier)
            VALUES (v_perm_key, 'Auto-generated permission for ' || v_perm_key, 3)
            ON CONFLICT (key) DO NOTHING;

            -- Ensure it exists in auth.scope
            INSERT INTO auth.scope (value, description)
            VALUES (v_perm_key, 'Auto-generated scope for ' || v_perm_key)
            ON CONFLICT (value) DO NOTHING;
            
        END LOOP;
    END LOOP;

    -- B. Propagate Template permissions to all Tenant-specific Roles
    -- This ensures that 'tenant 1 accountant' has same perms as 'template accountant'
    INSERT INTO auth.role_permission (tenant_id, role_id, permission_id)
    SELECT r.tenant_id, r.id, p.id
    FROM auth.role r
    JOIN auth.role_template rt ON r.slug = rt.slug
    CROSS JOIN LATERAL jsonb_array_elements_text(rt.data_scope) as scope_key
    JOIN auth.permission p ON p.key = scope_key
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- C. Sync Client-Role-Scope intersections for Internal Clients
    -- This is the "Triadic" source of truth for the Login JWT.
    -- We assume internal clients (Web/Mobile) should have access to ALL permissions assigned to a role.
    FOR v_client_id IN SELECT id FROM auth.client WHERE is_internal = TRUE LOOP
        INSERT INTO auth.client_role_scope (client_id, role_id, scope_id)
        SELECT v_client_id, r.id, s.id
        FROM auth.role r
        JOIN auth.role_template rt ON r.slug = rt.slug
        CROSS JOIN LATERAL jsonb_array_elements_text(rt.data_scope) as scope_key
        JOIN auth.scope s ON s.value = scope_key
        ON CONFLICT (client_id, role_id, scope_id) DO NOTHING;
    END LOOP;

    -- D. Run the Internal Client Whitelist sync as well
    PERFORM auth.proc_sync_internal_client_scopes();

    RAISE NOTICE 'Security state synchronized successfully across all tenants and internal clients.';
END;
$$ LANGUAGE plpgsql;

-- 3. Run the sync immediately
SELECT auth.sync_security_state();
