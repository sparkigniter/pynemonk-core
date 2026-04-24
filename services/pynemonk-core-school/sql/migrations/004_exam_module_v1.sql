-- ─────────────────────────────────────────────────────────────────────────────
-- 004_exam_module_v1.sql
-- Enhancing the Exam module with Terms, Papers, and Student Invitations.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Exam Terms (e.g. First Term, Second Term)
CREATE TABLE IF NOT EXISTS school.exam_term (
    id               serial        NOT NULL,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    academic_year_id int           NOT NULL REFERENCES school.academic_year(id),
    name             varchar(100)  NOT NULL,          -- e.g. "First Term"
    start_date       DATE,
    end_date         DATE,
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- 2. Link existing exams to Terms
ALTER TABLE school.exam ADD COLUMN IF NOT EXISTS exam_term_id int REFERENCES school.exam_term(id);

-- 3. Exam Paper (Schedule for specific subjects within an exam)
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

-- 4. Exam Invitation (Target Grades or Classrooms)
CREATE TABLE IF NOT EXISTS school.exam_invitation (
    id               serial        NOT NULL,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    exam_id          int           NOT NULL REFERENCES school.exam(id),
    grade_id         int           REFERENCES school.grade(id),
    classroom_id     int           REFERENCES school.classroom(id),
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- 5. Exam Student (Detailed tracking of invitations and exclusions)
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
CREATE INDEX IF NOT EXISTS idx_exam_student_exam ON school.exam_student (exam_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_exam_student_student ON school.exam_student (student_id) WHERE is_deleted = FALSE;
