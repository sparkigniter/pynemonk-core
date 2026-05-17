-- Add config column to report_template table
ALTER TABLE accounting.report_template ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;
