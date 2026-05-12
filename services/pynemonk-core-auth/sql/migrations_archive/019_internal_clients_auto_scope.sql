-- Migration: 019_internal_clients_auto_scope.sql
-- Description: Ensures that internal system clients always have access to all available scopes.

-- 1. Add 'is_internal' flag to clients
ALTER TABLE auth.client ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE;

-- 2. Mark existing official clients as internal
UPDATE auth.client 
SET is_internal = TRUE 
WHERE client_id IN ('frontend_client', '03458d1b77bf121e', 'mobile_app');

-- 3. Pure Logic Function (can be called manually)
CREATE OR REPLACE FUNCTION auth.proc_sync_internal_client_scopes()
RETURNS VOID AS $$
BEGIN
    INSERT INTO auth.client_scope (client_id, scope_id)
    SELECT c.id, s.id
    FROM auth.client c, auth.scope s
    WHERE c.is_internal = TRUE
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger Wrapper
CREATE OR REPLACE FUNCTION auth.trg_func_sync_internal_client_scopes()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM auth.proc_sync_internal_client_scopes();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Triggers
DROP TRIGGER IF EXISTS trg_sync_scopes_on_new_scope ON auth.scope;
CREATE TRIGGER trg_sync_scopes_on_new_scope
AFTER INSERT ON auth.scope
FOR EACH STATEMENT
EXECUTE FUNCTION auth.trg_func_sync_internal_client_scopes();

DROP TRIGGER IF EXISTS trg_sync_scopes_on_internal_client ON auth.client;
CREATE TRIGGER trg_sync_scopes_on_internal_client
AFTER INSERT OR UPDATE OF is_internal ON auth.client
FOR EACH ROW
WHEN (NEW.is_internal = TRUE)
EXECUTE FUNCTION auth.trg_func_sync_internal_client_scopes();

-- 6. Initial sync
SELECT auth.proc_sync_internal_client_scopes();
