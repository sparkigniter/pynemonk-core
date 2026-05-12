-- Migration: Provision Missing System Roles
-- Description: Ensures all roles marked as is_system=TRUE in the template are present for all tenants.

DO $$
DECLARE
    t_id INT;
    r_template RECORD;
BEGIN
    FOR t_id IN SELECT id FROM auth.tenant WHERE is_deleted = FALSE LOOP
        FOR r_template IN SELECT slug, name, description, tier, is_system, data_scope FROM auth.role_template WHERE is_system = TRUE LOOP
            INSERT INTO auth.role (tenant_id, slug, name, description, tier, is_system, data_scope, is_deleted, created_at, updated_at)
            VALUES (t_id, r_template.slug, r_template.name, r_template.description, r_template.tier, r_template.is_system, r_template.data_scope, FALSE, NOW(), NOW())
            ON CONFLICT (tenant_id, slug) WHERE is_deleted = FALSE DO UPDATE SET 
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                tier = EXCLUDED.tier,
                data_scope = EXCLUDED.data_scope;
        END LOOP;
    END LOOP;
END $$;
