-- Migration: 024_fix_client_role_whitelists.sql
-- Description: Standardizes the client_role whitelists for internal clients.
-- This ensures that teachers, admins, and other standard roles are explicitly authorized 
-- for the Web and Mobile apps, preventing 'Access Denied' errors even if the code fallback is missing.

-- 1. Ensure all standard roles are whitelisted for all Internal Clients
INSERT INTO auth.client_role (client_id, role_id)
SELECT c.id, r.id
FROM auth.client c
CROSS JOIN auth.role r
WHERE c.is_internal = TRUE
AND r.slug IN (
    'system_admin', 
    'school_admin', 
    'owner', 
    'principal', 
    'vice_principal', 
    'teacher', 
    'accountant', 
    'admissions_officer', 
    'parent', 
    'student'
)
ON CONFLICT (client_id, role_id) DO NOTHING;

-- 2. Specifically ensure the known problematic client ID is covered
-- (Though the above query should cover it if is_internal=TRUE)
INSERT INTO auth.client_role (client_id, role_id)
SELECT c.id, r.id
FROM auth.client c
CROSS JOIN auth.role r
WHERE c.client_id IN ('03458d1b77bf121e', 'frontend_client', 'mobile_app')
AND r.slug IN ('teacher', 'school_admin', 'accountant')
ON CONFLICT (client_id, role_id) DO NOTHING;

RAISE NOTICE 'Client-Role whitelists have been synchronized for internal clients.';
