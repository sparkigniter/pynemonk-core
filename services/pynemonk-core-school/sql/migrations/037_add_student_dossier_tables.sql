-- Migration: 037_add_student_dossier_tables.sql
-- Description: Create missing student_document and student_log tables.

-- 1. Student Documents Table
CREATE TABLE IF NOT EXISTS school.student_document (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES auth.tenant(id),
    student_id INTEGER NOT NULL REFERENCES school.student(id),
    document_type VARCHAR(50) NOT NULL, -- 'TC', 'Birth Certificate', 'ID Proof', etc.
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Student Timeline/Log Table
CREATE TABLE IF NOT EXISTS school.student_log (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES auth.tenant(id),
    student_id INTEGER NOT NULL REFERENCES school.student(id),
    event_type VARCHAR(50) NOT NULL, -- 'admission', 'promotion', 'disciplinary', 'achievement', 'fee_payment'
    description TEXT NOT NULL,
    metadata JSONB, -- For storing extra details like grade_id, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_student_log_student_id ON school.student_log(student_id);
CREATE INDEX IF NOT EXISTS idx_student_doc_student_id ON school.student_document(student_id);
