-- Migration: 005_advanced_auth_and_settings
-- Description: Implement separate settings table and relational role-scope assignments.

-- 0. Ensure unique value in auth.scope and client_scope
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_scope_value') THEN
        ALTER TABLE auth.scope ADD CONSTRAINT uq_scope_value UNIQUE (value);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_client_scope') THEN
        ALTER TABLE auth.client_scope ADD CONSTRAINT uq_client_scope UNIQUE (client_id, scope_id);
    END IF;
END $$;

-- 1. Create Tenant Settings table
CREATE TABLE IF NOT EXISTS auth.tenant_setting (
    id          serial       NOT NULL,
    tenant_id   int          NOT NULL REFERENCES auth.tenant(id),
    key         varchar(100) NOT NULL,
    value       text         NOT NULL,
    is_public   boolean      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (tenant_id, key)
);

-- 2. Migrate existing settings from JSONB to the new table
DO $$
DECLARE
    t_id INT;
    t_settings JSONB;
    s_key TEXT;
    s_value TEXT;
BEGIN
    FOR t_id, t_settings IN SELECT id, settings FROM auth.tenant WHERE settings IS NOT NULL AND settings != '{}'::jsonb LOOP
        FOR s_key, s_value IN SELECT * FROM jsonb_each_text(t_settings) LOOP
            INSERT INTO auth.tenant_setting (tenant_id, key, value)
            VALUES (t_id, s_key, s_value)
            ON CONFLICT (tenant_id, key) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 3. Drop the settings column from tenant table
-- ALTER TABLE auth.tenant DROP COLUMN IF EXISTS settings;

-- 4. Create Role-Scope assignment table
CREATE TABLE IF NOT EXISTS auth.role_scope (
    id          serial   NOT NULL,
    tenant_id   int      REFERENCES auth.tenant(id),
    role_id     int      NOT NULL REFERENCES auth.role(id),
    scope_id    int      NOT NULL REFERENCES auth.scope(id),
    granted     boolean  NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (role_id, scope_id)
);

-- 5. Populate auth.scope from auth.permission if it's empty
INSERT INTO auth.scope (value, description)
SELECT key, description FROM auth.permission
ON CONFLICT (value) DO NOTHING;

-- 6. Migrate existing data_scope from auth.role to auth.role_scope
DO $$
DECLARE
    r_id INT;
    r_tenant_id INT;
    r_data_scope JSONB;
    s_value TEXT;
    s_id INT;
BEGIN
    FOR r_id, r_tenant_id, r_data_scope IN SELECT id, tenant_id, data_scope FROM auth.role LOOP
        FOR s_value IN SELECT jsonb_array_elements_text(r_data_scope) LOOP
            SELECT id INTO s_id FROM auth.scope WHERE value = s_value;
            IF s_id IS NOT NULL THEN
                INSERT INTO auth.role_scope (tenant_id, role_id, scope_id)
                VALUES (r_tenant_id, r_id, s_id)
                ON CONFLICT (role_id, scope_id) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- 7. Assign all scopes to the default frontend client
INSERT INTO auth.client_scope (client_id, scope_id)
SELECT c.id, s.id
FROM auth.client c, auth.scope s
WHERE c.client_id = '03458d1b77bf121e'
ON CONFLICT DO NOTHING;
