-- Migration: 048_planner_topic.sql
-- Description: Table for manual planner topics (lessons) and schema updates for micro-planner

CREATE TABLE IF NOT EXISTS school.planner_topic (
    id SERIAL PRIMARY KEY,
    chapter_id INT NOT NULL REFERENCES school.planner_chapter(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_topic_chapter ON school.planner_topic(chapter_id);

-- Update lesson_plan table to support structured topic linkage
ALTER TABLE school.lesson_plan ADD COLUMN IF NOT EXISTS planner_topic_id INT REFERENCES school.planner_topic(id) ON DELETE SET NULL;
