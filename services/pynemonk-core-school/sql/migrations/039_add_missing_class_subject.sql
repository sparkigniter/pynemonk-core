-- Migration: 039_add_missing_class_subject.sql
-- Description: Create missing class_subject table.

CREATE TABLE IF NOT EXISTS school.class_subject (
    id           serial  NOT NULL PRIMARY KEY,
    tenant_id    int     NOT NULL REFERENCES auth.tenant(id),
    classroom_id int     NOT NULL REFERENCES school.classroom(id),
    subject_id   int     NOT NULL REFERENCES school.subject(id),
    is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_class_subject UNIQUE (classroom_id, subject_id)
);
