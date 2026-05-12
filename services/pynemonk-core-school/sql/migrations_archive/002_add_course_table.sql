-- ─────────────────────────────────────────────────────────────────────────────
-- pynemonk-core-school : 002_add_course_table.sql
-- Adds the missing course table.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS school.course (
    id          serial        NOT NULL,
    tenant_id   int           NOT NULL REFERENCES auth.tenant(id),
    name        varchar(100)  NOT NULL,
    code        varchar(20),
    description text,
    is_deleted  BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_course_tenant ON school.course (tenant_id) WHERE is_deleted = FALSE;
