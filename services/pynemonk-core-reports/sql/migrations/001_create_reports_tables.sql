-- Create reports schema and tables
CREATE SCHEMA IF NOT EXISTS reports;

CREATE TABLE IF NOT EXISTS reports.template (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- 'trial_balance', 'profit_loss', 'balance_sheet', 'cash_flow', 'aging', 'student_grades'
    name VARCHAR(255) NOT NULL,
    template_html TEXT NOT NULL,
    template_css TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT reports_template_uniq UNIQUE (tenant_id, report_type, name)
);

CREATE TABLE IF NOT EXISTS reports.job (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    format VARCHAR(20) NOT NULL, -- 'pdf', 'csv', 'xlsx'
    filters JSONB DEFAULT '{}'::jsonb,
    password VARCHAR(255),
    email_dispatch VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    file_path TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy existing templates from accounting if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'accounting' AND table_name = 'report_template'
    ) THEN
        INSERT INTO reports.template (tenant_id, report_type, name, template_html, template_css, config, is_default, created_at, updated_at)
        SELECT tenant_id, report_type, name, template_html, template_css, config, is_default, created_at, updated_at
        FROM accounting.report_template
        ON CONFLICT (tenant_id, report_type, name) DO UPDATE SET
            template_html = EXCLUDED.template_html,
            template_css = EXCLUDED.template_css,
            config = EXCLUDED.config,
            is_default = EXCLUDED.is_default,
            updated_at = NOW();
    END IF;
END $$;

-- Seed standard defaults for tenant_id = 1 (to ensure they are available even if the legacy table was empty)
INSERT INTO reports.template (tenant_id, report_type, name, template_html, template_css, config, is_default)
VALUES
(1, 'trial_balance', 'Standard Trial Balance', '<h1>Trial Balance</h1><div class="data-matrix-placeholder">{{#table}}</div>', '', '{}'::jsonb, TRUE),
(1, 'profit_loss', 'Standard P&L', '<h1>Profit & Loss</h1><div class="data-matrix-placeholder">{{#table}}</div>', '', '{}'::jsonb, TRUE),
(1, 'balance_sheet', 'Standard Balance Sheet', '<h1>Balance Sheet</h1><div class="data-matrix-placeholder">{{#table}}</div>', '', '{}'::jsonb, TRUE),
(1, 'cash_flow', 'Standard Cash Flow', '<h1>Cash Flow</h1><div class="data-matrix-placeholder">{{#table}}</div>', '', '{}'::jsonb, TRUE),
(1, 'aging', 'Standard AR/AP Aging', '<h1>Aging Report</h1><div class="data-matrix-placeholder">{{#table}}</div>', '', '{}'::jsonb, TRUE),
(1, 'student_grades', 'Standard Student Grades', '<h1>Student Grade Report</h1><div class="data-matrix-placeholder">{{#table}}</div>', '', '{}'::jsonb, TRUE)
ON CONFLICT (tenant_id, report_type, name) DO NOTHING;
