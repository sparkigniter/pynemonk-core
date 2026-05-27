-- Migration: 046_lesson_plan.sql
-- Description: Schema for the Timetable Lesson Planner (Micro-Planner)

CREATE TABLE IF NOT EXISTS school.lesson_plan (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES auth.tenant(id),
    staff_id INT NOT NULL REFERENCES school.staff(id),
    classroom_id INT NOT NULL REFERENCES school.classroom(id),
    subject_id INT NOT NULL REFERENCES school.subject(id),
    planner_chapter_id INT REFERENCES school.planner_chapter(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    period_start_time TIME NOT NULL,
    topic_title VARCHAR(255),
    teaching_notes TEXT,
    homework_assigned TEXT,
    status VARCHAR(30) DEFAULT 'PLANNED', -- 'PLANNED', 'COMPLETED', 'DELAYED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_lesson_plan UNIQUE (tenant_id, staff_id, classroom_id, subject_id, scheduled_date, period_start_time)
);

CREATE INDEX IF NOT EXISTS idx_lesson_plan_teacher_date ON school.lesson_plan(tenant_id, staff_id, scheduled_date);
