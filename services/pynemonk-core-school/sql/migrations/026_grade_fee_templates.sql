-- Migration: 026_grade_fee_templates
-- Description: Allows mapping of grades to fee structures for automated bulk allocation

CREATE TABLE IF NOT EXISTS school.grade_fee_template (
    id                  SERIAL PRIMARY KEY,
    tenant_id           INTEGER NOT NULL REFERENCES auth.tenant(id),
    academic_year_id    INTEGER NOT NULL REFERENCES school.academic_year(id),
    grade_id            INTEGER NOT NULL REFERENCES school.grade(id),
    fee_structure_id    INTEGER NOT NULL REFERENCES school.fee_structure(id),
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_grade_fee_template UNIQUE (tenant_id, academic_year_id, grade_id)
);

-- Add an index for lookup during student enrollment/bulk allocation
CREATE INDEX IF NOT EXISTS idx_grade_fee_template_lookup ON school.grade_fee_template(tenant_id, academic_year_id, grade_id);
