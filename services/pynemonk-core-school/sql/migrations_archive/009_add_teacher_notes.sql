-- ─────────────────────────────────────────────────────────────────────────────
-- pynemonk-core-school : 009_add_teacher_notes.sql
-- Table for private teacher notes linked to classes, subjects, and periods.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS school.teacher_note (
    id               serial        NOT NULL,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    staff_id         int           NOT NULL REFERENCES school.staff(id),
    classroom_id     int           REFERENCES school.classroom(id),
    subject_id       int           REFERENCES school.subject(id),
    timetable_id     int           REFERENCES school.timetable(id), -- Linked to a specific period if applicable
    note_date        DATE          NOT NULL DEFAULT CURRENT_DATE,
    content          text          NOT NULL,
    is_completed     BOOLEAN       NOT NULL DEFAULT FALSE,
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Index for fast retrieval of a teacher's notes for a specific day
CREATE INDEX IF NOT EXISTS idx_teacher_note_staff_date ON school.teacher_note (staff_id, note_date) WHERE is_deleted = FALSE;

-- Index for retrieving notes for a specific class/subject context
CREATE INDEX IF NOT EXISTS idx_teacher_note_context ON school.teacher_note (classroom_id, subject_id) WHERE is_deleted = FALSE;
