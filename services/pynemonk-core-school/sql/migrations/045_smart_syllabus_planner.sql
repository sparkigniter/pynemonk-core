-- Migration: 045_smart_syllabus_planner.sql
-- Description: Schema for the centralized global syllabus repository and automated academic planning engine.

-- ==========================================
-- 1. GLOBAL CONTENT SCHEMA (Cross-Tenant)
-- ==========================================

CREATE TABLE IF NOT EXISTS school.global_board (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'CBSE', 'ICSE', 'State Board'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school.global_grade (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'Class 10', 'Grade 5'
    sequence_order SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school.global_subject (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'Mathematics', 'Science'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school.global_syllabus (
    id SERIAL PRIMARY KEY,
    board_id INT NOT NULL REFERENCES school.global_board(id),
    grade_id INT NOT NULL REFERENCES school.global_grade(id),
    subject_id INT NOT NULL REFERENCES school.global_subject(id),
    academic_year VARCHAR(20) NOT NULL, -- e.g., '2024-2025'
    total_recommended_hours INT DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_global_syllabus UNIQUE (board_id, grade_id, subject_id, academic_year)
);

CREATE TABLE IF NOT EXISTS school.global_chapter (
    id SERIAL PRIMARY KEY,
    syllabus_id INT NOT NULL REFERENCES school.global_syllabus(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_order INT NOT NULL DEFAULT 0,
    recommended_periods INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school.global_topic (
    id SERIAL PRIMARY KEY,
    chapter_id INT NOT NULL REFERENCES school.global_chapter(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    learning_outcomes TEXT,
    sequence_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school.topic_resource (
    id SERIAL PRIMARY KEY,
    topic_id INT NOT NULL REFERENCES school.global_topic(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'HOMEWORK', 'ACTIVITY', 'VIDEO', 'DOCUMENT'
    title VARCHAR(255) NOT NULL,
    resource_url VARCHAR(1000),
    content_data TEXT, -- JSON or Markdown content if embedded
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school.question_bank (
    id SERIAL PRIMARY KEY,
    topic_id INT NOT NULL REFERENCES school.global_topic(id) ON DELETE CASCADE,
    question_type VARCHAR(30) NOT NULL, -- 'MCQ', 'DESCRIPTIVE', 'FILL_IN'
    difficulty VARCHAR(20) NOT NULL, -- 'EASY', 'MEDIUM', 'HARD'
    taxonomy_level VARCHAR(30), -- 'KNOWLEDGE', 'APPLICATION', 'ANALYSIS'
    question_text TEXT NOT NULL,
    options JSONB, -- For MCQs: {"A": "Opt1", "B": "Opt2", ...}
    answer_key TEXT NOT NULL,
    marks NUMERIC(5,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. TENANT CONTEXT (School Specific Mapping)
-- ==========================================

-- Connects the school's subject to the global syllabus blueprint
CREATE TABLE IF NOT EXISTS school.school_syllabus_subscription (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES auth.tenant(id),
    academic_year_id INT NOT NULL REFERENCES school.academic_year(id),
    school_subject_id INT NOT NULL REFERENCES school.subject(id),
    global_syllabus_id INT NOT NULL REFERENCES school.global_syllabus(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_school_subscription UNIQUE (tenant_id, academic_year_id, school_subject_id)
);

-- Replaces or extends the old planner_chapter/planner_milestone logic
CREATE TABLE IF NOT EXISTS school.auto_academic_plan (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES auth.tenant(id),
    school_syllabus_id INT NOT NULL REFERENCES school.school_syllabus_subscription(id),
    classroom_id INT NOT NULL REFERENCES school.classroom(id),
    teacher_id INT NOT NULL REFERENCES school.staff(id),
    is_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_auto_plan_classroom UNIQUE (classroom_id, school_syllabus_id)
);

CREATE TABLE IF NOT EXISTS school.planned_session (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES auth.tenant(id),
    plan_id INT NOT NULL REFERENCES school.auto_academic_plan(id) ON DELETE CASCADE,
    global_topic_id INT NOT NULL REFERENCES school.global_topic(id),
    scheduled_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED', -- 'PLANNED', 'COMPLETED', 'DELAYED', 'SKIPPED'
    teacher_notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planned_session_plan_date ON school.planned_session(plan_id, scheduled_date);

-- ==========================================
-- END OF MIGRATION
-- ==========================================
