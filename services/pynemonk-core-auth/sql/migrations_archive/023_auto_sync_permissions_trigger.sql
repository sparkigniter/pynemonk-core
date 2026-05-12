-- Migration: 023_auto_sync_permissions_trigger.sql
-- Description: AUTOMATION LAYER. This ensures that any permission assigned via the Admin UI 
-- is immediately propagated to all internal clients (Web/Mobile) without manual intervention.

-- 1. Create the Sync Function
CREATE OR REPLACE FUNCTION auth.trg_func_sync_client_role_scope()
RETURNS TRIGGER AS $$
BEGIN
    -- If a permission was GRANTED to a role...
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.granted = TRUE)) THEN
        -- Map it to all Internal Clients (Web Frontend, Mobile App)
        INSERT INTO auth.client_role_scope (client_id, role_id, scope_id)
        SELECT c.id, NEW.role_id, s.id
        FROM auth.client c
        JOIN auth.permission p ON p.id = NEW.permission_id
        JOIN auth.scope s ON p.key = s.value
        WHERE c.is_internal = TRUE
        ON CONFLICT (client_id, role_id, scope_id) DO UPDATE SET granted = TRUE;
    
    -- If a permission was REVOKED from a role...
    ELSIF (TG_OP = 'UPDATE' AND NEW.granted = FALSE) THEN
        UPDATE auth.client_role_scope crs
        SET granted = FALSE
        FROM auth.client c, auth.permission p, auth.scope s
        WHERE crs.client_id = c.id 
          AND crs.role_id = NEW.role_id
          AND p.id = NEW.permission_id
          AND s.value = p.key
          AND c.is_internal = TRUE;
          
    -- If a permission was DELETED from a role...
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM auth.client_role_scope crs
        USING auth.client c, auth.permission p, auth.scope s
        WHERE crs.client_id = c.id 
          AND crs.role_id = OLD.role_id
          AND p.id = OLD.permission_id
          AND s.value = p.key
          AND c.is_internal = TRUE;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the Trigger to the Admin UI's target table
DROP TRIGGER IF EXISTS trg_sync_permissions_to_clients ON auth.role_permission;
CREATE TRIGGER trg_sync_permissions_to_clients
AFTER INSERT OR UPDATE OR DELETE ON auth.role_permission
FOR EACH ROW
EXECUTE FUNCTION auth.trg_func_sync_client_role_scope();

-- 3. Run a one-time backfill to catch up the current state
INSERT INTO auth.client_role_scope (client_id, role_id, scope_id)
SELECT c.id, rp.role_id, s.id
FROM auth.role_permission rp
JOIN auth.permission p ON rp.permission_id = p.id
JOIN auth.scope s ON p.key = s.value
CROSS JOIN auth.client c
WHERE c.is_internal = TRUE AND rp.granted = TRUE
ON CONFLICT (client_id, role_id, scope_id) DO UPDATE SET granted = TRUE;

RAISE NOTICE 'Permission Automation Trigger is now ACTIVE. Manual sync is no longer required.';
