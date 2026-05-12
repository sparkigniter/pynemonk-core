-- Migration: Enhanced Student Dossier & Documents
-- Description: Adds detailed fields to student and guardian tables, and creates tables for documents and logs.

-- 1. Enhance Student Table
ALTER TABLE school.student 
ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5),
ADD COLUMN IF NOT EXISTS religion VARCHAR(50),
ADD COLUMN IF NOT EXISTS mother_tongue VARCHAR(50),
ADD COLUMN IF NOT EXISTS id_number VARCHAR(50), -- National ID / Aadhaar
ADD COLUMN IF NOT EXISTS previous_school TEXT,
ADD COLUMN IF NOT EXISTS medical_notes TEXT,
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
ADD COLUMN IF NOT EXISTS admission_date DATE DEFAULT CURRENT_DATE;

-- 2. Enhance Guardian Table
ALTER TABLE school.guardian
ADD COLUMN IF NOT EXISTS id_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS occupation VARCHAR(100),
ADD COLUMN IF NOT EXISTS income_range VARCHAR(50),
ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS relation_type VARCHAR(20) DEFAULT 'other'; -- father, mother, etc.

-- 3. Student Documents Table
CREATE TABLE IF NOT EXISTS school.student_document (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL REFERENCES school.student(id),
    document_type VARCHAR(50) NOT NULL, -- 'TC', 'Birth Certificate', 'ID Proof', etc.
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Student Timeline/Log Table
CREATE TABLE IF NOT EXISTS school.student_log (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL REFERENCES school.student(id),
    event_type VARCHAR(50) NOT NULL, -- 'admission', 'promotion', 'disciplinary', 'achievement', 'fee_payment'
    description TEXT NOT NULL,
    metadata JSONB, -- For storing extra details like grade_id, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_student_log_student_id ON school.student_log(student_id);
CREATE INDEX IF NOT EXISTS idx_student_doc_student_id ON school.student_document(student_id);
