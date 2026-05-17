-- ─────────────────────────────────────────────────────────────────────────────
-- Certificate Templates
-- Allows schools to design their own HTML templates for TC, ID Cards, etc.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS school.certificate_template (
    id              serial        NOT NULL,
    tenant_id       int           NOT NULL REFERENCES auth.tenant(id),
    name            varchar(100)  NOT NULL,
    type            varchar(50)   NOT NULL, -- 'TRANSFER_CERTIFICATE', 'ID_CARD', etc.
    html_content    text          NOT NULL,
    is_default      BOOLEAN       NOT NULL DEFAULT FALSE,
    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_template_tenant_type UNIQUE (tenant_id, type)
);

CREATE INDEX IF NOT EXISTS idx_certificate_template_tenant ON school.certificate_template (tenant_id) WHERE is_deleted = FALSE;
