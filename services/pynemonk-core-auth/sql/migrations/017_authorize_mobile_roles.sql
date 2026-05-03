-- Migration: 017_authorize_mobile_roles
-- Description: Authorizes Staff, Parents, and Students to use the frontend and mobile clients.

INSERT INTO auth.client_role (client_id, role_id)
SELECT c.id, r.id
FROM auth.client c, auth.role r
WHERE c.client_id IN ('frontend_client', 'mobile_app')
AND r.slug IN ('school_admin', 'principal', 'vice_principal', 'teacher', 'parent', 'student')
ON CONFLICT (client_id, role_id) DO NOTHING;
