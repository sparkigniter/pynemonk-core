-- Migration: Integration Hub Core
-- Description: Creates generic tables to support third-party software integrations (e.g., SATS, SARAL, Edudel).

-- 1. Integration Settings (Tenant-scoped configuration for various systems)
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

-- 2. External Identity Registry (Mapping Pynemonk entities to external system IDs)
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

-- 3. Integration Audit Log (Track sync attempts and successes/failures)
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
