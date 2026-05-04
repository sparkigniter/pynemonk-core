-- Migration: 012_global_template_roles
-- Description: Creates global instances (tenant_id IS NULL) of all role templates to allow platform-wide permission management.

DO $$
DECLARE
    r_template RECORD;
BEGIN
    FOR r_template IN SELECT slug, name, description, tier, is_system, data_scope FROM auth.role_template LOOP
        -- Create a global role entry if it doesn't exist
        INSERT INTO auth.role (tenant_id, slug, name, description, tier, is_system, data_scope, is_deleted, created_at, updated_at)
        VALUES (NULL, r_template.slug, r_template.name, r_template.description, r_template.tier, r_template.is_system, r_template.data_scope, FALSE, NOW(), NOW())
        ON CONFLICT (slug) WHERE tenant_id IS NULL AND is_deleted = FALSE DO UPDATE SET 
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            tier = EXCLUDED.tier,
            data_scope = EXCLUDED.data_scope;
    END LOOP;
END $$;
