-- Migration: 036_add_missing_leave_and_integration.sql
-- Description: Create missing staff_leave and integration-hub tables.

-- 1. Staff Leave Table
CREATE TABLE IF NOT EXISTS school.staff_leave (
    id           serial       NOT NULL PRIMARY KEY,
    tenant_id    int          NOT NULL REFERENCES auth.tenant(id),
    staff_id     int          NOT NULL REFERENCES school.staff(id),
    leave_type   varchar(30)  NOT NULL DEFAULT 'casual',  -- casual, sick, earned, maternity
    start_date   DATE         NOT NULL,
    end_date     DATE         NOT NULL,
    reason       text,
    status       varchar(20)  NOT NULL DEFAULT 'pending',  -- pending, approved, rejected
    approved_by  int          REFERENCES school.staff(id),
    approved_at  TIMESTAMPTZ,
    is_deleted   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. Integration Settings
CREATE TABLE IF NOT EXISTS school.integration_setting (
    id              SERIAL PRIMARY KEY,
    tenant_id       INT NOT NULL REFERENCES auth.tenant(id),
    system_slug     VARCHAR(50) NOT NULL, -- e.g., 'karnataka_sats', 'maharashtra_saral'
    config_data     JSONB NOT NULL DEFAULT '{}', -- Store API keys, credentials, or custom mapping rules
    is_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, system_slug)
);

-- 3. External Identity Registry
CREATE TABLE IF NOT EXISTS school.external_identity (
    id              SERIAL PRIMARY KEY,
    tenant_id       INT NOT NULL REFERENCES auth.tenant(id),
    entity_type     VARCHAR(50) NOT NULL, -- 'student', 'staff', 'classroom', 'grade'
    entity_id       INT NOT NULL,
    system_slug     VARCHAR(50) NOT NULL, -- e.g., 'karnataka_sats'
    external_id     VARCHAR(100) NOT NULL, -- The ID in the government software
    metadata        JSONB DEFAULT '{}', -- Store extra state-specific data (e.g., registration status)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, entity_type, entity_id, system_slug)
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_ext_identity_lookup ON school.external_identity (tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ext_identity_system ON school.external_identity (system_slug, external_id);

-- 4. Integration Audit Log
CREATE TABLE IF NOT EXISTS school.integration_sync_log (
    id              SERIAL PRIMARY KEY,
    tenant_id       INT NOT NULL REFERENCES auth.tenant(id),
    system_slug     VARCHAR(50) NOT NULL,
    action_type     VARCHAR(50) NOT NULL, -- 'export', 'api_sync', 'validation'
    status          VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
    entity_count    INT DEFAULT 0,
    message         TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
