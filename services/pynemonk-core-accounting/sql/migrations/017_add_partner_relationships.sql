-- Migration: 017_add_partner_relationships.sql
-- Description: Adds a parent/guardian relationship to the partner table for consolidated family billing.

-- 1. Add parent_partner_id to accounting.partner
ALTER TABLE accounting.partner 
ADD COLUMN IF NOT EXISTS parent_partner_id INTEGER REFERENCES accounting.partner(id);

-- 2. Migrate relationships from school.student_guardian
-- This links 'student' partners to their 'guardian' partners.
DO $$
BEGIN
    -- Update existing student partners to link to their guardian partners
    -- We pick the first guardian found in the mapping.
    UPDATE accounting.partner p_student
    SET parent_partner_id = p_guardian.id
    FROM school.student_guardian sg
    JOIN accounting.partner p_guardian ON p_guardian.tenant_id = sg.tenant_id 
        AND p_guardian.external_ref_type = 'guardian' 
        AND p_guardian.external_ref_id = sg.guardian_id
    WHERE p_student.external_ref_type = 'student' 
    AND p_student.external_ref_id = sg.student_id
    AND p_student.parent_partner_id IS NULL;
END $$;

-- 3. Update system_account_mapping to add a label for Family Statements
INSERT INTO accounting.system_account_mapping (tenant_id, mapping_key, account_id, category, label)
SELECT id, 'FAMILY_STATEMENT_ENABLED', NULL, 'Reporting', 'Enable Consolidated Family Billing Statements'
FROM auth.tenant
ON CONFLICT DO NOTHING;
