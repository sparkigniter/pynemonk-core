-- ─────────────────────────────────────────────────────────────────────────────
-- 006_exam_marks_entry.sql
-- Tables for recording student marks and finalized results.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Exam Marks (Per Subject/Paper)
CREATE TABLE IF NOT EXISTS school.exam_marks (
    id               serial        NOT NULL,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    exam_id          int           NOT NULL REFERENCES school.exam(id),
    paper_id         int           NOT NULL REFERENCES school.exam_paper(id),
    student_id       int           NOT NULL REFERENCES school.student(id),
    marks_obtained   numeric(6,2),
    is_absent        BOOLEAN       NOT NULL DEFAULT FALSE,
    remarks          text,
    created_by       int, -- user_id of the teacher
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_exam_marks UNIQUE (paper_id, student_id)
);

-- 2. Add Status to Exam for finalization
ALTER TABLE school.exam ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'draft'; -- draft, scheduled, ongoing, marking, finalized, published

-- 3. Exam Result Summary (Aggregate)
CREATE TABLE IF NOT EXISTS school.exam_result (
    id               serial        NOT NULL,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    exam_id          int           NOT NULL REFERENCES school.exam(id),
    student_id       int           NOT NULL REFERENCES school.student(id),
    total_marks      numeric(8,2),
    percentage       numeric(5,2),
    grade            varchar(10),
    result_status    varchar(20), -- pass, fail, withheld
    is_finalized     BOOLEAN       NOT NULL DEFAULT FALSE,
    finalized_at     TIMESTAMPTZ,
    PRIMARY KEY (id),
    CONSTRAINT uq_exam_result UNIQUE (exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_marks_paper ON school.exam_marks (paper_id);
CREATE INDEX IF NOT EXISTS idx_exam_result_exam ON school.exam_result (exam_id);
