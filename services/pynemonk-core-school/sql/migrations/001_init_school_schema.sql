-- ─────────────────────────────────────────────────────────────────────────────
-- Pynemonk School Module — Consolidated Migration
-- Purpose: Defines the entire academic, student management, and assessment schema.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS school;

-- 1. Core Academic Structure
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS school.academic_year (
    id          serial       NOT NULL PRIMARY KEY,
    tenant_id   int          NOT NULL REFERENCES auth.tenant(id),
    name        varchar(50)  NOT NULL,
    start_date  DATE         NOT NULL,
    end_date    DATE         NOT NULL,
    is_current  BOOLEAN      NOT NULL DEFAULT FALSE,
    is_deleted  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_academic_year_tenant_name UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS school.course (
    id          serial        NOT NULL PRIMARY KEY,
    tenant_id   int           NOT NULL REFERENCES auth.tenant(id),
    name        varchar(100)  NOT NULL,
    code        varchar(20),
    description text,
    is_deleted  BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school.grade (
    id              serial        NOT NULL PRIMARY KEY,
    tenant_id       int           NOT NULL REFERENCES auth.tenant(id),
    name            varchar(50)   NOT NULL,
    slug            varchar(50)   NOT NULL,
    sequence_order  smallint      NOT NULL DEFAULT 0,
    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_grade_tenant_slug UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS school.subject (
    id               serial        NOT NULL PRIMARY KEY,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    grade_id         int           NOT NULL REFERENCES school.grade(id),
    name             varchar(100)  NOT NULL,
    code             varchar(20),
    description      text,
    periods_per_week smallint      DEFAULT 5,
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_subject_tenant_grade_code UNIQUE (tenant_id, grade_id, code)
);

-- 2. People (Staff & Students)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS school.staff (
    id              serial        NOT NULL PRIMARY KEY,
    tenant_id       int           NOT NULL REFERENCES auth.tenant(id),
    user_id         int           NOT NULL REFERENCES auth.user(id),
    employee_code   varchar(30),
    first_name      varchar(100)  NOT NULL,
    last_name       varchar(100),
    gender          varchar(10),
    date_of_birth   DATE,
    phone           varchar(20),
    address         text,
    qualification   varchar(200),
    designation     varchar(100),
    status          varchar(20)   NOT NULL DEFAULT 'active',
    avatar_url      varchar(500),
    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_staff_tenant_user UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS school.classroom (
    id               serial       NOT NULL PRIMARY KEY,
    tenant_id        int          NOT NULL REFERENCES auth.tenant(id),
    academic_year_id int          NOT NULL REFERENCES school.academic_year(id),
    grade_id         int          NOT NULL REFERENCES school.grade(id),
    section          varchar(5)   NOT NULL,
    name             varchar(50)  NOT NULL,
    room             varchar(30),
    capacity         smallint,
    class_teacher_id int          REFERENCES school.staff(id),
    is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_classroom_tenant_year_grade_section UNIQUE (tenant_id, academic_year_id, grade_id, section)
);

CREATE TABLE IF NOT EXISTS school.student (
    id              serial        NOT NULL PRIMARY KEY,
    tenant_id       int           NOT NULL REFERENCES auth.tenant(id),
    user_id         int           NOT NULL REFERENCES auth.user(id),
    admission_no    varchar(30)   NOT NULL,
    first_name      varchar(100)  NOT NULL,
    last_name       varchar(100),
    gender          varchar(10),
    date_of_birth   DATE,
    phone           varchar(20),
    address         text,
    avatar_url      varchar(500),
    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_tenant_admission UNIQUE (tenant_id, admission_no),
    CONSTRAINT uq_student_tenant_user UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS school.student_enrollment (
    id               serial  NOT NULL PRIMARY KEY,
    tenant_id        int     NOT NULL REFERENCES auth.tenant(id),
    student_id       int     NOT NULL REFERENCES school.student(id),
    classroom_id     int     NOT NULL REFERENCES school.classroom(id),
    academic_year_id int     NOT NULL REFERENCES school.academic_year(id),
    roll_number      varchar(20),
    status           varchar(20) NOT NULL DEFAULT 'active',
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_enrollment_student_year UNIQUE (student_id, academic_year_id)
);

-- 3. Academic Operations (Timetable, Attendance, Homework)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS school.timetable (
    id               serial      NOT NULL PRIMARY KEY,
    tenant_id        int         NOT NULL REFERENCES auth.tenant(id),
    classroom_id     int         NOT NULL REFERENCES school.classroom(id),
    subject_id       int         NOT NULL REFERENCES school.subject(id),
    teacher_id       int         NOT NULL REFERENCES school.staff(id),
    academic_year_id int         REFERENCES school.academic_year(id),
    day_of_week      smallint    NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time       TIME        NOT NULL,
    end_time         TIME        NOT NULL,
    is_sticky        BOOLEAN     NOT NULL DEFAULT FALSE,
    is_deleted       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_timetable_active_slot 
ON school.timetable (classroom_id, day_of_week, start_time, academic_year_id) 
WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS school.attendance (
    id              serial       NOT NULL PRIMARY KEY,
    tenant_id       int          NOT NULL REFERENCES auth.tenant(id),
    enrollment_id   int          NOT NULL REFERENCES school.student_enrollment(id),
    date            DATE         NOT NULL,
    status          varchar(15)  NOT NULL DEFAULT 'present',
    remarks         text,
    marked_by       int          REFERENCES school.staff(id),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_enrollment_date UNIQUE (enrollment_id, date)
);

CREATE TABLE IF NOT EXISTS school.homework (
    id               serial        NOT NULL PRIMARY KEY,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    classroom_id     int           NOT NULL REFERENCES school.classroom(id),
    subject_id       int           NOT NULL REFERENCES school.subject(id),
    staff_id         int           NOT NULL REFERENCES school.staff(id),
    title            varchar(200)  NOT NULL,
    description      text,
    due_date         TIMESTAMPTZ   NOT NULL,
    assignment_type  VARCHAR(30)   DEFAULT 'homework',
    submission_type  VARCHAR(30)   DEFAULT 'both',
    max_attempts     INT           DEFAULT 1,
    allow_late       BOOLEAN       DEFAULT FALSE,
    is_graded        BOOLEAN       DEFAULT TRUE,
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 4. Assessments (Exams & Results)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS school.exam (
    id               serial        NOT NULL PRIMARY KEY,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    academic_year_id int           NOT NULL REFERENCES school.academic_year(id),
    name             varchar(100)  NOT NULL,
    description      TEXT,
    exam_type        varchar(30)   NOT NULL DEFAULT 'periodic',
    start_date       DATE          NOT NULL,
    end_date         DATE          NOT NULL,
    status           varchar(20)   DEFAULT 'draft',
    results_published BOOLEAN      DEFAULT FALSE,
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school.exam_paper (
    id               serial        NOT NULL PRIMARY KEY,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    exam_id          int           NOT NULL REFERENCES school.exam(id) ON DELETE CASCADE,
    subject_id       int           NOT NULL REFERENCES school.subject(id),
    paper_date       DATE          NOT NULL,
    start_time       TIME          NOT NULL,
    end_time         TIME          NOT NULL,
    max_marks        numeric(6,2)  NOT NULL DEFAULT 100,
    supervisor_id    int           REFERENCES school.staff(id),
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school.exam_marks (
    id               serial        NOT NULL PRIMARY KEY,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    exam_id          int           NOT NULL REFERENCES school.exam(id),
    paper_id         int           NOT NULL REFERENCES school.exam_paper(id),
    student_id       int           NOT NULL REFERENCES school.student(id),
    marks_obtained   numeric(6,2),
    is_absent        BOOLEAN       NOT NULL DEFAULT FALSE,
    remarks          text,
    created_by       int,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_exam_marks UNIQUE (paper_id, student_id)
);

-- 5. System & Settings
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS school.settings (
    id          serial NOT NULL PRIMARY KEY,
    tenant_id   int NOT NULL REFERENCES auth.tenant(id),
    key         varchar(100) NOT NULL,
    value       text NOT NULL,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_setting_key UNIQUE (tenant_id, key)
);

CREATE TABLE IF NOT EXISTS school.period_config (
    id              serial      NOT NULL PRIMARY KEY,
    tenant_id       int         NOT NULL REFERENCES auth.tenant(id),
    name            varchar(50) NOT NULL,
    start_time      TIME        NOT NULL,
    end_time        TIME        NOT NULL,
    is_break        BOOLEAN     NOT NULL DEFAULT TRUE,
    is_deleted      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
-- 6. Schema Patches (For Existing Databases)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ 
BEGIN
    -- Exam Patches
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='school' AND table_name='exam') THEN
        ALTER TABLE school.exam ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'draft';
        ALTER TABLE school.exam ADD COLUMN IF NOT EXISTS results_published BOOLEAN DEFAULT FALSE;
        ALTER TABLE school.exam ADD COLUMN IF NOT EXISTS description TEXT;
    END IF;

    -- Exam Paper Patches
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='school' AND table_name='exam_paper') THEN
        ALTER TABLE school.exam_paper ADD COLUMN IF NOT EXISTS supervisor_id int REFERENCES school.staff(id);
    END IF;

    -- Timetable Patches
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='school' AND table_name='timetable') THEN
        ALTER TABLE school.timetable ADD COLUMN IF NOT EXISTS is_sticky BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    -- Subject Patches
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='school' AND table_name='subject') THEN
        ALTER TABLE school.subject ADD COLUMN IF NOT EXISTS periods_per_week smallint DEFAULT 5;
    END IF;

    -- Homework Patches
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='school' AND table_name='homework') THEN
        ALTER TABLE school.homework ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(30) DEFAULT 'homework';
        ALTER TABLE school.homework ADD COLUMN IF NOT EXISTS submission_type VARCHAR(30) DEFAULT 'both';
        ALTER TABLE school.homework ADD COLUMN IF NOT EXISTS max_attempts INT DEFAULT 1;
        ALTER TABLE school.homework ADD COLUMN IF NOT EXISTS allow_late BOOLEAN DEFAULT FALSE;
        ALTER TABLE school.homework ADD COLUMN IF NOT EXISTS auto_close BOOLEAN DEFAULT TRUE;
        ALTER TABLE school.homework ADD COLUMN IF NOT EXISTS is_graded BOOLEAN DEFAULT TRUE;
        ALTER TABLE school.homework ADD COLUMN IF NOT EXISTS rubric TEXT;
    END IF;

    -- Student Patches
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='school' AND table_name='student') THEN
        ALTER TABLE school.student ADD COLUMN IF NOT EXISTS religion VARCHAR(50);
        ALTER TABLE school.student ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5);
        ALTER TABLE school.student ADD COLUMN IF NOT EXISTS nationality VARCHAR(50);
        ALTER TABLE school.student ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20);
    END IF;
END $$;

-- Final Sync
INSERT INTO school.settings (tenant_id, key, value)
SELECT id, 'admission_number_format', 'ADM-{YEAR}-{SEQ}' FROM auth.tenant
ON CONFLICT DO NOTHING;
