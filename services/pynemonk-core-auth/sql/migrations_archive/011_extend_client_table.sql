-- Migration: 011_extend_client_table
-- Description: Adds redirect_uris and grant_types to the auth.client table for full OAuth2 support.

ALTER TABLE auth.client 
ADD COLUMN IF NOT EXISTS redirect_uris TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS grant_types TEXT[] DEFAULT '{"authorization_code", "refresh_token"}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update the existing frontend client with some defaults
UPDATE auth.client 
SET redirect_uris = '{"http://localhost:5173/callback", "http://localhost:8000/callback"}',
    grant_types = '{"password", "authorization_code", "refresh_token"}'
WHERE client_id = 'frontend_client';
