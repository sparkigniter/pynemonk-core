-- Migration: 008_add_accounting_settings.sql
-- Description: Adds a settings table to store tenant-specific accounting configurations like currency.

CREATE TABLE IF NOT EXISTS accounting.settings (
    tenant_id       INTEGER PRIMARY KEY REFERENCES auth.tenant(id),
    base_currency   VARCHAR(10) DEFAULT 'USD',
    currency_symbol VARCHAR(5) DEFAULT '$',
    fiscal_year_start DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings for existing tenants
INSERT INTO accounting.settings (tenant_id, base_currency, currency_symbol)
SELECT id, 'USD', '$' FROM auth.tenant
ON CONFLICT (tenant_id) DO NOTHING;
