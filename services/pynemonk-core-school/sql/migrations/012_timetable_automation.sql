-- ─────────────────────────────────────────────────────────────────────────────
-- Timetable Automation & Sticky Periods
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add sticky flag to timetable
ALTER TABLE school.timetable 
ADD COLUMN IF NOT EXISTS is_sticky BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add workload requirements to subjects
ALTER TABLE school.subject
ADD COLUMN IF NOT EXISTS periods_per_week smallint DEFAULT 5;

-- 3. Teacher Availability Table
CREATE TABLE IF NOT EXISTS school.staff_availability (
    id              serial      NOT NULL,
    tenant_id       int         NOT NULL REFERENCES auth.tenant(id),
    staff_id        int         NOT NULL REFERENCES school.staff(id),
    day_of_week     smallint    NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time      TIME        NOT NULL,
    end_time        TIME        NOT NULL,
    is_available    BOOLEAN     NOT NULL DEFAULT TRUE,
    is_deleted      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_staff_availability UNIQUE (staff_id, day_of_week, start_time)
);

CREATE INDEX IF NOT EXISTS idx_staff_availability_staff ON school.staff_availability (staff_id) WHERE is_deleted = FALSE;
