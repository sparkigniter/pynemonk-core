-- LMS Lite: Knowledge Library & Assignment Submissions

-- 1. Digital Resource Library
CREATE TABLE IF NOT EXISTS school.lms_resource (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES auth.tenant(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL, -- 'pdf', 'video', 'link', 'doc', 'image'
    url TEXT NOT NULL,
    subject_id INTEGER REFERENCES school.subject(id),
    grade_id INTEGER REFERENCES school.grade(id),
    classroom_id INTEGER REFERENCES school.classroom(id),
    created_by INTEGER NOT NULL,
    is_public BOOLEAN DEFAULT FALSE, -- Visible to all if true
    tags TEXT[],
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Student Submissions for Homework/Assignments
CREATE TABLE IF NOT EXISTS school.lms_submission (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES auth.tenant(id),
    homework_id INTEGER NOT NULL REFERENCES school.homework(id),
    student_id INTEGER NOT NULL REFERENCES school.student(id),
    submission_text TEXT,
    file_urls TEXT[],
    status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'late', 'graded', 'returned'
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Grading Info
    marks_obtained DECIMAL(5,2),
    teacher_feedback TEXT,
    graded_by INTEGER,
    graded_at TIMESTAMP WITH TIME ZONE,
    
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(homework_id, student_id) -- Only one submission per student per homework
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_lms_resource_tenant ON school.lms_resource(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lms_resource_subject ON school.lms_resource(subject_id);
CREATE INDEX IF NOT EXISTS idx_lms_submission_homework ON school.lms_submission(homework_id);
CREATE INDEX IF NOT EXISTS idx_lms_submission_student ON school.lms_submission(student_id);
