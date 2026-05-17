-- Add unique constraint to report_template for upsert support
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'report_template_tenant_type_name_unique') THEN
        ALTER TABLE accounting.report_template ADD CONSTRAINT report_template_tenant_type_name_unique UNIQUE (tenant_id, report_type, name);
    END IF;
END $$;
