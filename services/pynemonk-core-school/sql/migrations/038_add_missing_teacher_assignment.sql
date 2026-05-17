-- Migration: 038_add_missing_teacher_assignment.sql
-- Description: Create missing teacher_assignment table and indexes.

CREATE TABLE IF NOT EXISTS school.teacher_assignment (
    id               serial  NOT NULL PRIMARY KEY,
    tenant_id        int     NOT NULL REFERENCES auth.tenant(id),
    staff_id         int     NOT NULL REFERENCES school.staff(id),
    classroom_id     int     NOT NULL REFERENCES school.classroom(id),
    subject_id       int     NOT NULL REFERENCES school.subject(id),
    academic_year_id int     NOT NULL REFERENCES school.academic_year(id),
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_teacher_assignment UNIQUE (staff_id, classroom_id, subject_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignment_staff ON school.teacher_assignment (staff_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_teacher_assignment_classroom ON school.teacher_assignment (classroom_id) WHERE is_deleted = FALSE;
