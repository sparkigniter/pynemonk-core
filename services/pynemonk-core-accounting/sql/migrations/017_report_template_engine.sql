-- Migration 017: Report Template Engine
CREATE TABLE IF NOT EXISTS accounting.report_template (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'profit_loss', 'balance_sheet', 'aging', 'invoice'
    name VARCHAR(100) NOT NULL,
    template_html TEXT NOT NULL,
    template_css TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, report_type, is_default)
);

-- Default Templates for PL and BS
INSERT INTO accounting.report_template (tenant_id, report_type, name, template_html, is_default)
VALUES 
(1, 'profit_loss', 'Standard P&L', '<h1>Profit & Loss</h1><table>...</table>', TRUE),
(1, 'balance_sheet', 'Standard Balance Sheet', '<h1>Balance Sheet</h1><table>...</table>', TRUE);
