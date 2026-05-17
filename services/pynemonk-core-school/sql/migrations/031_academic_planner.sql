-- Migration: 031_academic_planner.sql
-- Description: Create academic planner schema tables for teacher syllabus planning and tracking.

CREATE TABLE IF NOT EXISTS school.academic_planner (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES auth.tenant(id),
    academic_year_id INTEGER NOT NULL REFERENCES school.academic_year(id),
    staff_id INTEGER NOT NULL REFERENCES school.staff(id),
    subject_id INTEGER NOT NULL REFERENCES school.subject(id),
    grade_id INTEGER NOT NULL REFERENCES school.grade(id),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_planner_tenant_year_staff_sub_grade UNIQUE (tenant_id, academic_year_id, staff_id, subject_id, grade_id)
);

CREATE TABLE IF NOT EXISTS school.planner_chapter (
    id SERIAL PRIMARY KEY,
    planner_id INTEGER NOT NULL REFERENCES school.academic_planner(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_order INTEGER NOT NULL DEFAULT 0,
    estimated_lessons INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    start_date DATE,
    end_date DATE,
    completed_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS school.planner_milestone (
    id SERIAL PRIMARY KEY,
    planner_id INTEGER NOT NULL REFERENCES school.academic_planner(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_planner_tenant ON school.academic_planner(tenant_id);
CREATE INDEX IF NOT EXISTS idx_planner_staff ON school.academic_planner(staff_id);
CREATE INDEX IF NOT EXISTS idx_chapter_planner ON school.planner_chapter(planner_id);
CREATE INDEX IF NOT EXISTS idx_milestone_planner ON school.planner_milestone(planner_id);
