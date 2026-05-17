-- Migration: 041_create_missing_exam_tables.sql
-- Description: Creates missing exam terms, papers, invitations, and student registrations.

-- 1. Exam Terms
CREATE TABLE IF NOT EXISTS school.exam_term (
    id               serial        NOT NULL,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    academic_year_id int           NOT NULL REFERENCES school.academic_year(id),
    name             varchar(100)  NOT NULL,
    start_date       DATE,
    end_date         DATE,
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Link exams to Terms
ALTER TABLE school.exam ADD COLUMN IF NOT EXISTS exam_term_id int REFERENCES school.exam_term(id);

-- 2. Exam Paper
CREATE TABLE IF NOT EXISTS school.exam_paper (
    id               serial        NOT NULL,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    exam_id          int           NOT NULL REFERENCES school.exam(id),
    subject_id       int           NOT NULL REFERENCES school.subject(id),
    exam_date        DATE          NOT NULL,
    start_time       TIME          NOT NULL,
    end_time         TIME          NOT NULL,
    room             varchar(50),
    max_marks        numeric(6,2)  NOT NULL DEFAULT 100,
    passing_marks    numeric(6,2)  NOT NULL DEFAULT 33,
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- 3. Exam Invitation
CREATE TABLE IF NOT EXISTS school.exam_invitation (
    id               serial        NOT NULL,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    exam_id          int           NOT NULL REFERENCES school.exam(id),
    grade_id         int           REFERENCES school.grade(id),
    classroom_id     int           REFERENCES school.classroom(id),
    subject_id       int           REFERENCES school.subject(id),
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- 4. Exam Student
CREATE TABLE IF NOT EXISTS school.exam_student (
    id               serial        NOT NULL,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    exam_id          int           NOT NULL REFERENCES school.exam(id),
    student_id       int           NOT NULL REFERENCES school.student(id),
    is_excluded      BOOLEAN       NOT NULL DEFAULT FALSE,
    exclusion_reason text,
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_exam_student UNIQUE (exam_id, student_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_term_tenant ON school.exam_term (tenant_id, academic_year_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_exam_paper_exam ON school.exam_paper (exam_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_exam_invitation_exam ON school.exam_invitation (exam_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_exam_invitation_subject ON school.exam_invitation (subject_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_exam_student_exam ON school.exam_student (exam_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_exam_student_student ON school.exam_student (student_id) WHERE is_deleted = FALSE;
