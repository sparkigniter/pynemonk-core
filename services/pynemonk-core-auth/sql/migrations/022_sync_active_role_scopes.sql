-- Migration: 022_sync_active_role_scopes.sql
-- Description: Sync data_scope of all active tenant roles with their latest templates and trigger IAM republish.

-- 1. Sync all active roles with their latest templates
UPDATE auth.role r
SET data_scope = rt.data_scope
FROM auth.role_template rt
WHERE r.slug = rt.slug;

-- 2. Republish IAM state to apply all permission and scope changes across the entire system
SELECT auth.proc_publish_iam_state();
