-- ─────────────────────────────────────────────────────────────────────────────
-- Multistage Admission Workflow
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS school.admission_application (
    id              serial        NOT NULL PRIMARY KEY,
    tenant_id       int           NOT NULL REFERENCES auth.tenant(id),
    application_no  varchar(30)   NOT NULL,
    status          varchar(30)   NOT NULL DEFAULT 'draft', -- draft, submitted, verified, test_scheduled, test_completed, approved, rejected, completed
    current_stage   varchar(50)   NOT NULL DEFAULT 'student', -- student, guardian, documents, test, finance, completed
    
    -- Progress Data (JSONB for flexibility during draft stages)
    student_data    jsonb         DEFAULT '{}',
    parent_data     jsonb         DEFAULT '{}',
    document_data   jsonb         DEFAULT '{}',
    test_data       jsonb         DEFAULT '{}',
    finance_data    jsonb         DEFAULT '{}',
    
    -- Metadata
    academic_year_id int          REFERENCES school.academic_year(id),
    grade_id        int           REFERENCES school.grade(id),
    
    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_by      int,
    updated_by      int,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_admission_tenant_app_no UNIQUE (tenant_id, application_no)
);

CREATE INDEX IF NOT EXISTS idx_admission_status ON school.admission_application (tenant_id, status) WHERE is_deleted = FALSE;

-- Optional: Admission Stages Config (for future customization)
CREATE TABLE IF NOT EXISTS school.admission_config (
    id              serial        NOT NULL PRIMARY KEY,
    tenant_id       int           NOT NULL REFERENCES auth.tenant(id),
    workflow_steps  jsonb         NOT NULL, -- List of steps and whether they are required/optional
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_admission_config_tenant UNIQUE (tenant_id)
);
