-- ─────────────────────────────────────────────────────────────────────────────
-- School Settings & Sequence Tracking
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. School Settings Table
CREATE TABLE IF NOT EXISTS school.settings (
    id                      serial      NOT NULL,
    tenant_id               int         NOT NULL REFERENCES auth.tenant(id),
    admission_number_format varchar(100) NOT NULL DEFAULT 'ADM-{YEAR}-{SEQ}',
    next_admission_seq      int         NOT NULL DEFAULT 1,
    is_deleted              BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_school_settings_tenant UNIQUE (tenant_id)
);

-- 2. Sequence Tracker (for various types)
CREATE TABLE IF NOT EXISTS school.sequence_tracker (
    id              serial      NOT NULL,
    tenant_id       int         NOT NULL REFERENCES auth.tenant(id),
    type            varchar(30) NOT NULL, -- 'student', 'staff', 'invoice'
    last_value      int         NOT NULL DEFAULT 0,
    prefix          varchar(10),
    is_deleted      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_sequence_type UNIQUE (tenant_id, type)
);

-- Insert default settings for existing tenants (if any)
INSERT INTO school.settings (tenant_id)
SELECT id FROM auth.tenant
ON CONFLICT (tenant_id) DO NOTHING;
