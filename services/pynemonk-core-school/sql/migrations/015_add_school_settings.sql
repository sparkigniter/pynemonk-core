-- ─────────────────────────────────────────────────────────────────────────────
-- Refactor school.settings to Generic Key-Value Store
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the new generic settings table
CREATE TABLE IF NOT EXISTS school.settings_new (
    id          serial NOT NULL,
    tenant_id   int NOT NULL REFERENCES auth.tenant(id),
    key         varchar(100) NOT NULL,
    value       text NOT NULL,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_tenant_setting_key UNIQUE (tenant_id, key)
);

-- 2. Migrate data from old settings table if it exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='school' AND table_name='settings') THEN
        -- Migrate admission_number_format
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='school' AND table_name='settings' AND column_name='admission_number_format') THEN
            INSERT INTO school.settings_new (tenant_id, key, value)
            SELECT tenant_id, 'admission_number_format', admission_number_format FROM school.settings
            ON CONFLICT DO NOTHING;
        END IF;

        -- Migrate next_admission_seq
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='school' AND table_name='settings' AND column_name='next_admission_seq') THEN
            INSERT INTO school.settings_new (tenant_id, key, value)
            SELECT tenant_id, 'next_admission_seq', next_admission_seq::text FROM school.settings
            ON CONFLICT DO NOTHING;
        END IF;

        -- Drop the old table
        DROP TABLE school.settings CASCADE;
    END IF;
END $$;

-- 3. Rename new table to settings
ALTER TABLE school.settings_new RENAME TO settings;

CREATE INDEX IF NOT EXISTS idx_settings_tenant_key ON school.settings (tenant_id, key) WHERE is_deleted = FALSE;
