-- Migration: 049_question_paper_preparation.sql
-- Description: Create tables for managing sections and questions mapped to exam papers.

CREATE TABLE IF NOT EXISTS school.exam_paper_section (
    id               serial        NOT NULL,
    paper_id         int           NOT NULL REFERENCES school.exam_paper(id) ON DELETE CASCADE,
    section_name     varchar(100)  NOT NULL, -- e.g., 'Section A: Multiple Choice'
    instructions     text,                  -- e.g., 'Answer all questions.'
    sequence_order   int           NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS school.exam_paper_question (
    id               serial        NOT NULL,
    section_id       int           NOT NULL REFERENCES school.exam_paper_section(id) ON DELETE CASCADE,
    question_id      int           NOT NULL REFERENCES school.question_bank(id) ON DELETE CASCADE,
    sequence_order   int           NOT NULL DEFAULT 0,
    marks_allocated  numeric(5,2)  NOT NULL DEFAULT 1.0,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_exam_paper_section_paper ON school.exam_paper_section (paper_id);
CREATE INDEX IF NOT EXISTS idx_exam_paper_question_section ON school.exam_paper_question (section_id);
CREATE INDEX IF NOT EXISTS idx_exam_paper_question_qbank ON school.exam_paper_question (question_id);
