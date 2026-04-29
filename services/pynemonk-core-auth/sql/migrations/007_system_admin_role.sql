-- Migration: 007_system_admin_role
-- Description: Creates the global system_admin role for platform-wide management.

-- 0. Sync scopes from permissions
INSERT INTO auth.scope (value, description)
SELECT key, description FROM auth.permission
ON CONFLICT (value) DO NOTHING;

-- 0b. Ensure unique index for global roles
CREATE UNIQUE INDEX IF NOT EXISTS uq_global_role_slug ON auth.role (slug) WHERE tenant_id IS NULL AND is_deleted = FALSE;

-- 1. Create a global role (tenant_id IS NULL)
INSERT INTO auth.role (tenant_id, slug, name, description, tier, is_system, is_deleted)
VALUES (NULL, 'system_admin', 'System Administrator', 'Platform-wide administrator. Can manage auth clients, tenants, and global settings.', 0, TRUE, FALSE)
ON CONFLICT (slug) WHERE tenant_id IS NULL AND is_deleted = FALSE DO NOTHING;

-- 2. Add all scopes to this role
INSERT INTO auth.role_scope (role_id, scope_id)
SELECT r.id, s.id
FROM auth.role r, auth.scope s
WHERE r.slug = 'system_admin' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

-- 3. Assign this role to the user with ID 1 (Assuming user 1 is the primary dev/admin)
-- Replace 1 with the actual user ID if known, but for a start we can just have the role exist.
INSERT INTO auth.user_role (user_id, role_id, is_primary)
SELECT u.id, r.id, FALSE
FROM auth.user u, auth.role r
WHERE u.email = 'vikas@sparkigniter.com' -- Assuming this is the user's email based on the prompt
  AND r.slug = 'system_admin' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;
