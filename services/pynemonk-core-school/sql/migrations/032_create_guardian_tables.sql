-- ─────────────────────────────────────────────────────────────────────────────
-- Exam Term Tables & Patches
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.exam_term (
    id               serial        NOT NULL PRIMARY KEY,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    academic_year_id int           NOT NULL REFERENCES school.academic_year(id),
    name             varchar(100)  NOT NULL,
    start_date       DATE,
    end_date         DATE,
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_term_tenant ON school.exam_term (tenant_id, academic_year_id) WHERE is_deleted = FALSE;

ALTER TABLE school.exam ADD COLUMN IF NOT EXISTS exam_term_id INTEGER REFERENCES school.exam_term(id);
ALTER TABLE school.exam ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Exam Result View Bridge
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS school.exam_result CASCADE;
DROP VIEW IF EXISTS school.exam_result CASCADE;
CREATE OR REPLACE VIEW school.exam_result AS
SELECT 
    em.id,
    em.tenant_id,
    em.exam_id,
    em.student_id,
    ep.subject_id,
    ep.max_marks,
    em.marks_obtained as marks,
    NULL::varchar(5) as grade,
    em.remarks,
    em.is_absent,
    FALSE as is_deleted,
    em.created_at,
    em.updated_at
FROM school.exam_marks em
JOIN school.exam_paper ep ON em.paper_id = ep.id;

-- ─────────────────────────────────────────────────────────────────────────────
-- Guardian & Student-Guardian Tables
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.guardian (
    id              serial        NOT NULL PRIMARY KEY,
    tenant_id       int           NOT NULL REFERENCES auth.tenant(id),
    user_id         int           NOT NULL REFERENCES auth.user(id),
    first_name      varchar(100)  NOT NULL,
    last_name       varchar(100),
    gender          varchar(10),
    phone           varchar(20),
    email           citext        NOT NULL,
    address         text,
    occupation      varchar(100),
    avatar_url      varchar(500),
    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_guardian_tenant_user UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_guardian_tenant ON school.guardian (tenant_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS school.student_guardian (
    id              serial      NOT NULL PRIMARY KEY,
    tenant_id       int         NOT NULL REFERENCES auth.tenant(id),
    student_id      int         NOT NULL REFERENCES school.student(id),
    guardian_id     int         NOT NULL REFERENCES school.guardian(id),
    relation        varchar(50) NOT NULL,
    is_emergency    BOOLEAN     NOT NULL DEFAULT FALSE,
    is_deleted      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_guardian UNIQUE (student_id, guardian_id)
);
