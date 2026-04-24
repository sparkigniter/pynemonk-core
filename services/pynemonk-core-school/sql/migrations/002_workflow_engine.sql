-- ─────────────────────────────────────────────────────────────────────────────
-- pynemonk-core-school : 002_workflow_engine.sql
-- Workflow and Onboarding Engine for Students and Staff
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Workflow Template (The Blueprint)
CREATE TABLE IF NOT EXISTS school.workflow_template (
    id              serial       NOT NULL,
    tenant_id       int          NOT NULL REFERENCES auth.tenant(id),
    name            varchar(100) NOT NULL,                   -- e.g. "Primary School Admission"
    description     text,
    entity_type     varchar(20)  NOT NULL,                   -- 'student', 'staff', 'vendor'
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    is_system       BOOLEAN      NOT NULL DEFAULT FALSE,     -- If true, it's a global template
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- 2. Workflow Step Template (Individual Tasks)
CREATE TABLE IF NOT EXISTS school.workflow_step_template (
    id              serial       NOT NULL,
    tenant_id       int          NOT NULL REFERENCES auth.tenant(id),
    template_id     int          NOT NULL REFERENCES school.workflow_template(id),
    name            varchar(100) NOT NULL,                   -- e.g. "Verify Documents"
    description     text,
    step_order      smallint     NOT NULL DEFAULT 0,
    required_role   varchar(50),                             -- e.g. 'principal', 'registrar'
    task_type       varchar(30)  NOT NULL DEFAULT 'approval', -- approval, document_upload, form_fill, interview
    is_mandatory    BOOLEAN      NOT NULL DEFAULT TRUE,
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- 3. Workflow Instance (A live process for a candidate)
CREATE TABLE IF NOT EXISTS school.workflow_instance (
    id              serial       NOT NULL,
    tenant_id       int          NOT NULL REFERENCES auth.tenant(id),
    template_id     int          NOT NULL REFERENCES school.workflow_template(id),
    target_id       int,                                     -- Optional: Once onboarded, link to student/staff ID
    target_name     varchar(200) NOT NULL,                   -- Candidate name
    target_email    varchar(200),
    current_step_id int,                                     -- References school.workflow_step_template(id)
    status          varchar(20)  NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, rejected, cancelled
    started_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- 4. Workflow Step Instance (Execution status of each step)
CREATE TABLE IF NOT EXISTS school.workflow_step_instance (
    id              serial       NOT NULL,
    tenant_id       int          NOT NULL REFERENCES auth.tenant(id),
    instance_id     int          NOT NULL REFERENCES school.workflow_instance(id),
    step_template_id int         NOT NULL REFERENCES school.workflow_step_template(id),
    status          varchar(20)  NOT NULL DEFAULT 'pending', -- pending, completed, skipped, rejected
    completed_by    int,                                     -- References school.staff(id)
    completed_at    TIMESTAMPTZ,
    notes           text,
    attachment_url  varchar(500),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_instance_step UNIQUE (instance_id, step_template_id)
);

-- 5. Audit Log
CREATE TABLE IF NOT EXISTS school.workflow_log (
    id              serial       NOT NULL,
    tenant_id       int          NOT NULL REFERENCES auth.tenant(id),
    instance_id     int          NOT NULL REFERENCES school.workflow_instance(id),
    action          varchar(100) NOT NULL,
    performed_by    int,                                     -- References school.staff(id)
    details         jsonb,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_instance_tenant ON school.workflow_instance (tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_workflow_instance_status ON school.workflow_instance (status) WHERE is_deleted = FALSE;
