-- Migration: 010_create_frontend_client
-- Description: Creates the 'frontend_client' with 'frontend_secret' for easy development and admin access.

INSERT INTO auth.client (name, description, client_id, client_secret)
VALUES (
    'Main Frontend Client',
    'Default client for the web application',
    'frontend_client',
    'frontend_secret'
)
ON CONFLICT (client_id) DO UPDATE SET
    client_secret = EXCLUDED.client_secret;

-- Assign all existing scopes to this client
INSERT INTO auth.client_scope (client_id, scope_id)
SELECT c.id, s.id
FROM auth.client c, auth.scope s
WHERE c.client_id = 'frontend_client'
ON CONFLICT DO NOTHING;
