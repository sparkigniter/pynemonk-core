-- Migration: Relax installment_id constraint for one-off invoices
-- Description: Makes installment_id nullable in accounting.fee_invoice to support admissions and other non-installment fees.

ALTER TABLE accounting.fee_invoice ALTER COLUMN installment_id DROP NOT NULL;

-- Also add source_type and notes if missing (used in FeeAutomationService)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='accounting' AND table_name='fee_invoice' AND column_name='source_type') THEN
        ALTER TABLE accounting.fee_invoice ADD COLUMN source_type VARCHAR(50) DEFAULT 'fee';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='accounting' AND table_name='fee_invoice' AND column_name='notes') THEN
        ALTER TABLE accounting.fee_invoice ADD COLUMN notes TEXT;
    END IF;
END $$;
