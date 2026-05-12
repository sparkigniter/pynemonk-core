-- ─────────────────────────────────────────────────────────────────────────────
-- Timetable Stability & Break Management
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Fix unique constraint to allow re-generation (only unique when NOT deleted)
ALTER TABLE school.timetable DROP CONSTRAINT IF EXISTS uq_timetable_slot;
CREATE UNIQUE INDEX IF NOT EXISTS uq_timetable_active_slot 
ON school.timetable (classroom_id, day_of_week, start_time, academic_year_id) 
WHERE is_deleted = FALSE;

-- 2. Configuration table for Breaks & School Hours
CREATE TABLE IF NOT EXISTS school.period_config (
    id              serial      NOT NULL,
    tenant_id       int         NOT NULL REFERENCES auth.tenant(id),
    name            varchar(50) NOT NULL, -- "Lunch", "Short Break"
    start_time      TIME        NOT NULL,
    end_time        TIME        NOT NULL,
    is_break        BOOLEAN     NOT NULL DEFAULT TRUE,
    is_deleted      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Seed a default lunch break for demo
INSERT INTO school.period_config (tenant_id, name, start_time, end_time, is_break)
SELECT id, 'Lunch Break', '12:00:00', '13:00:00', true FROM auth.tenant
ON CONFLICT DO NOTHING;
