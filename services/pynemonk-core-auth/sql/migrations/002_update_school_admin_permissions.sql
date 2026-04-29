-- Migration: Update School Admin Permissions
-- Description: Adds settings:read, settings:write, report:read, report:export, and user:deactivate to all existing school_admin roles.

UPDATE auth.role 
SET data_scope = data_scope || '["settings:read", "settings:write", "report:read", "report:export", "user:deactivate"]'::jsonb
WHERE slug = 'school_admin' AND is_system = TRUE;
