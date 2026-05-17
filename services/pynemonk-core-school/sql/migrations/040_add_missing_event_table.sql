-- Migration: 040_add_missing_event_table.sql
-- Description: Create missing event table and index.

CREATE TABLE IF NOT EXISTS school.event (
    id          serial        NOT NULL PRIMARY KEY,
    tenant_id   int           NOT NULL REFERENCES auth.tenant(id),
    title       varchar(200)  NOT NULL,
    description text,
    event_type  varchar(30)   NOT NULL DEFAULT 'general',
    start_date  DATE          NOT NULL,
    end_date    DATE          NOT NULL,
    is_deleted  BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_tenant ON school.event (tenant_id, start_date) WHERE is_deleted = FALSE;
