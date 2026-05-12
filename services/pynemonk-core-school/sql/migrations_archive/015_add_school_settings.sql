-- ─────────────────────────────────────────────────────────────────────────────
-- Reset school.settings to Generic Key-Value Store
-- ─────────────────────────────────────────────────────────────────────────────

-- Force drop the old table to ensure a clean generic schema
DROP TABLE IF EXISTS school.settings CASCADE;

CREATE TABLE school.settings (
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

CREATE INDEX IF NOT EXISTS idx_settings_tenant_key ON school.settings (tenant_id, key) WHERE is_deleted = FALSE;
