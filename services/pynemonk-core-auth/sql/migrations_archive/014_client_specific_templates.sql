-- Migration: 014_client_specific_templates.sql
-- Description: Allow role templates to be scoped to specific clients.

ALTER TABLE auth.role_template ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES auth.client(id);

-- Drop the old unique slug constraint safely
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'role_template_slug_key' AND table_name = 'role_template') THEN
        ALTER TABLE auth.role_template DROP CONSTRAINT role_template_slug_key;
    END IF;
END $$;

-- Add a new unique constraint that accounts for the optional client_id
DROP INDEX IF EXISTS auth.uq_role_template_client_slug;
CREATE UNIQUE INDEX IF NOT EXISTS uq_role_template_client_slug ON auth.role_template (slug, COALESCE(client_id, 0));

-- Update Teacher template to be more restricted (Classroom focused)
UPDATE auth.role_template 
SET data_scope = '["student:read", "student.attendance:read", "student.attendance:write", "timetable:read", "class:read", "assignment:write"]'
WHERE slug = 'teacher' AND client_id IS NULL;
