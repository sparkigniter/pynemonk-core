-- Migration: 015_client_role_scope_architecture.sql
-- Description: Implement the triadic Client-Role-Scope relationship for app-specific permissions.

CREATE TABLE IF NOT EXISTS auth.client_role_scope (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES auth.client(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES auth.role(id) ON DELETE CASCADE,
    scope_id INTEGER NOT NULL REFERENCES auth.scope(id) ON DELETE CASCADE,
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (client_id, role_id, scope_id)
);

-- Index for fast lookup during login
CREATE INDEX IF NOT EXISTS idx_crs_client_role ON auth.client_role_scope (client_id, role_id);

-- Migration: Copy existing intersections if any (Optional, but good for stability)
-- For now, we leave it clean to allow the new "Sync Template" to take over.
