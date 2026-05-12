-- Migration: 013_client_role_assignment
-- Description: Creates the client_role table to explicitly tag which roles are allowed to use which OAuth clients.

CREATE TABLE IF NOT EXISTS auth.client_role (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES auth.tenant(id),
    client_id INT REFERENCES auth.client(id) ON DELETE CASCADE,
    role_id INT REFERENCES auth.role(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, role_id)
);

-- Seed: Allow system_admin to use all clients by default
INSERT INTO auth.client_role (client_id, role_id)
SELECT c.id, r.id
FROM auth.client c, auth.role r
WHERE r.slug = 'system_admin' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;
