-- ─────────────────────────────────────────────────────────────────────────────
-- Add school.settings table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS school.settings (
    id              serial        NOT NULL,
    tenant_id       int           NOT NULL REFERENCES auth.tenant(id),
    attendance_mode varchar(20)   NOT NULL DEFAULT 'DAILY', -- DAILY, PERIOD_WISE
    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_settings_tenant UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_settings_tenant ON school.settings (tenant_id) WHERE is_deleted = FALSE;
