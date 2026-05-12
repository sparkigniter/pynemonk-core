-- ─────────────────────────────────────────────────────────────────────────────
-- pynemonk-core-school : migrate.sql
-- PostgreSQL schema for the School module.
-- All tables are tenant-scoped and use soft deletes.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS school;

-- ─────────────────────────────────────────────────────────────────────────────
-- Academic Year
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.academic_year (
    id          serial       NOT NULL,
    tenant_id   int          NOT NULL REFERENCES auth.tenant(id),
    name        varchar(50)  NOT NULL,                   -- e.g. "2024-25"
    start_date  DATE         NOT NULL,
    end_date    DATE         NOT NULL,
    is_current  BOOLEAN      NOT NULL DEFAULT FALSE,
    is_deleted  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_academic_year_tenant_name UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_academic_year_tenant ON school.academic_year (tenant_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Grade (Level)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.grade (
    id              serial        NOT NULL,
    tenant_id       int           NOT NULL REFERENCES auth.tenant(id),
    name            varchar(50)   NOT NULL,              -- e.g. "Grade 10", "Kindergarten"
    slug            varchar(50)   NOT NULL,              -- e.g. "grade-10", "k1"
    sequence_order  smallint      NOT NULL DEFAULT 0,    -- For sorting / progression logic
    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_grade_tenant_slug UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_grade_tenant ON school.grade (tenant_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Subject
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.subject (
    id          serial        NOT NULL,
    tenant_id   int           NOT NULL REFERENCES auth.tenant(id),
    grade_id    int           NOT NULL REFERENCES school.grade(id),
    name        varchar(100)  NOT NULL,
    code        varchar(20),                             -- e.g. "MATH101"
    description text,
    is_deleted  BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_subject_tenant_grade_code UNIQUE (tenant_id, grade_id, code)
);

CREATE INDEX IF NOT EXISTS idx_subject_tenant ON school.subject (tenant_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Classroom  (grade_id + section)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.classroom (
    id               serial       NOT NULL,
    tenant_id        int          NOT NULL REFERENCES auth.tenant(id),
    academic_year_id int          NOT NULL REFERENCES school.academic_year(id),
    grade_id         int          NOT NULL REFERENCES school.grade(id),
    section          varchar(5)   NOT NULL,              -- A, B, C …
    name             varchar(50)  NOT NULL,              -- "Class 10-A"
    room             varchar(30),                        -- Physical room / lab
    capacity         smallint,
    class_teacher_id int,                               -- FK to school.staff (set after staff created)
    is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_classroom_tenant_year_grade_section
        UNIQUE (tenant_id, academic_year_id, grade_id, section)
);

CREATE INDEX IF NOT EXISTS idx_classroom_tenant_year ON school.classroom (tenant_id, academic_year_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Staff  (teachers, admin staff — linked to auth.user)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.staff (
    id              serial        NOT NULL,
    tenant_id       int           NOT NULL REFERENCES auth.tenant(id),
    user_id         int           NOT NULL REFERENCES auth.user(id),
    employee_code   varchar(30),
    first_name      varchar(100)  NOT NULL,
    last_name       varchar(100),
    gender          varchar(10),
    date_of_birth   DATE,
    blood_group     varchar(5),
    religion        varchar(50),
    nationality     varchar(50),
    phone           varchar(20),
    address         text,
    emergency_contact_name varchar(100),
    emergency_contact_phone varchar(20),
    marital_status  varchar(20),
    qualification   varchar(200),
    specialization  varchar(200),                        -- Subject area
    experience_years smallint,
    joining_date    DATE,
    designation     varchar(100),
    status          varchar(20)   NOT NULL DEFAULT 'active', -- active, inactive, on_leave
    aadhaar_number  varchar(20),
    pan_number      varchar(20),
    bank_account_no varchar(50),
    bank_name       varchar(100),
    ifsc_code       varchar(20),
    avatar_url      varchar(500),
    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_staff_tenant_user UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_tenant ON school.staff (tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_staff_user ON school.staff (user_id) WHERE is_deleted = FALSE;

-- Add FK from classroom → staff after staff table exists
ALTER TABLE school.classroom DROP CONSTRAINT IF EXISTS fk_classroom_class_teacher;
ALTER TABLE school.classroom
    ADD CONSTRAINT fk_classroom_class_teacher
    FOREIGN KEY (class_teacher_id) REFERENCES school.staff(id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Class–Subject mapping  (M:N — which subjects are taught in which class)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.class_subject (
    id           serial  NOT NULL,
    tenant_id    int     NOT NULL REFERENCES auth.tenant(id),
    classroom_id int     NOT NULL REFERENCES school.classroom(id),
    subject_id   int     NOT NULL REFERENCES school.subject(id),
    is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_class_subject UNIQUE (classroom_id, subject_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Teacher Assignment  (teacher → class + subject)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.teacher_assignment (
    id               serial  NOT NULL,
    tenant_id        int     NOT NULL REFERENCES auth.tenant(id),
    staff_id         int     NOT NULL REFERENCES school.staff(id),
    classroom_id     int     NOT NULL REFERENCES school.classroom(id),
    subject_id       int     NOT NULL REFERENCES school.subject(id),
    academic_year_id int     NOT NULL REFERENCES school.academic_year(id),
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_teacher_assignment UNIQUE (staff_id, classroom_id, subject_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignment_staff ON school.teacher_assignment (staff_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_teacher_assignment_classroom ON school.teacher_assignment (classroom_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Timetable  (period schedule per class-subject-day)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.timetable (
    id               serial      NOT NULL,
    tenant_id        int         NOT NULL REFERENCES auth.tenant(id),
    classroom_id     int         NOT NULL REFERENCES school.classroom(id),
    subject_id       int         NOT NULL REFERENCES school.subject(id),
    staff_id         int         NOT NULL REFERENCES school.staff(id),
    academic_year_id int         NOT NULL REFERENCES school.academic_year(id),
    day_of_week      smallint    NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Mon
    period_number    smallint    NOT NULL,
    start_time       TIME        NOT NULL,
    end_time         TIME        NOT NULL,
    room             varchar(30),                        -- Override room for this period
    is_deleted       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_timetable_slot UNIQUE (classroom_id, day_of_week, period_number, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_timetable_classroom ON school.timetable (classroom_id, academic_year_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Student  (linked to auth.user)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.student (
    id              serial        NOT NULL,
    tenant_id       int           NOT NULL REFERENCES auth.tenant(id),
    user_id         int           NOT NULL REFERENCES auth.user(id),
    admission_no    varchar(30)   NOT NULL,
    first_name      varchar(100)  NOT NULL,
    last_name       varchar(100),
    gender          varchar(10),
    date_of_birth   DATE,
    blood_group     varchar(5),
    nationality     varchar(50),
    religion        varchar(50),
    phone           varchar(20),
    address         text,
    avatar_url      varchar(500),
    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_student_tenant_admission UNIQUE (tenant_id, admission_no),
    CONSTRAINT uq_student_tenant_user UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_student_tenant ON school.student (tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_student_user ON school.student (user_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Student Enrollment  (student → classroom per academic year)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.student_enrollment (
    id               serial  NOT NULL,
    tenant_id        int     NOT NULL REFERENCES auth.tenant(id),
    student_id       int     NOT NULL REFERENCES school.student(id),
    classroom_id     int     NOT NULL REFERENCES school.classroom(id),
    academic_year_id int     NOT NULL REFERENCES school.academic_year(id),
    roll_number      varchar(20),
    enrollment_date  DATE    NOT NULL DEFAULT CURRENT_DATE,
    status           varchar(20) NOT NULL DEFAULT 'active',  -- active, transferred, withdrawn
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_enrollment_student_year UNIQUE (student_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollment_classroom ON school.student_enrollment (classroom_id, academic_year_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_enrollment_student ON school.student_enrollment (student_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Attendance  (daily attendance per student)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.attendance (
    id              serial       NOT NULL,
    tenant_id       int          NOT NULL REFERENCES auth.tenant(id),
    enrollment_id   int          NOT NULL REFERENCES school.student_enrollment(id),
    date            DATE         NOT NULL,
    status          varchar(15)  NOT NULL DEFAULT 'present',  -- present, absent, late, half_day, holiday
    check_in_time   TIME,                                     -- For biometric integration
    check_out_time  TIME,
    remarks         text,
    marked_by       int          REFERENCES school.staff(id),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_attendance_enrollment_date UNIQUE (enrollment_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_enrollment ON school.attendance (enrollment_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_attendance_date ON school.attendance (tenant_id, date) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Exam
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.exam_term (
    id               serial        NOT NULL,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    academic_year_id int           NOT NULL REFERENCES school.academic_year(id),
    name             varchar(100)  NOT NULL,          -- e.g. "First Term"
    start_date       DATE,
    end_date         DATE,
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_exam_term_tenant ON school.exam_term (tenant_id, academic_year_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS school.exam (
    id               serial        NOT NULL,
    tenant_id        int           NOT NULL REFERENCES auth.tenant(id),
    academic_year_id int           NOT NULL REFERENCES school.academic_year(id),
    exam_term_id     int           REFERENCES school.exam_term(id),
    name             varchar(100)  NOT NULL,          -- "Unit Test 1", "Mid Term", "Final"
    exam_type        varchar(30)   NOT NULL DEFAULT 'periodic',  -- periodic, term, annual
    start_date       DATE          NOT NULL,
    end_date         DATE          NOT NULL,
    description      text,
    is_published     BOOLEAN       NOT NULL DEFAULT FALSE,
    results_published BOOLEAN      NOT NULL DEFAULT FALSE,
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_exam_tenant_year ON school.exam (tenant_id, academic_year_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Exam Result  (marks per student per subject per exam)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.exam_result (
    id          serial         NOT NULL,
    tenant_id   int            NOT NULL REFERENCES auth.tenant(id),
    exam_id     int            NOT NULL REFERENCES school.exam(id),
    student_id  int            NOT NULL REFERENCES school.student(id),
    subject_id  int            NOT NULL REFERENCES school.subject(id),
    max_marks   numeric(6,2)   NOT NULL DEFAULT 100,
    marks       numeric(6,2),
    grade       varchar(5),
    remarks     text,
    is_absent   BOOLEAN        NOT NULL DEFAULT FALSE,
    is_deleted  BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_exam_result UNIQUE (exam_id, student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_result_student ON school.exam_result (student_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_exam_result_exam ON school.exam_result (exam_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Grade Boundary  (improvement: score → grade mapping per tenant)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.grade_boundary (
    id          serial       NOT NULL,
    tenant_id   int          NOT NULL REFERENCES auth.tenant(id),
    grade       varchar(5)   NOT NULL,               -- A+, A, B+, B, C, D, F
    min_percent numeric(5,2) NOT NULL,
    max_percent numeric(5,2) NOT NULL,
    gpa_value   numeric(4,2),                        -- Optional GPA equivalent
    is_deleted  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Homework
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.homework (
    id           serial        NOT NULL,
    tenant_id    int           NOT NULL REFERENCES auth.tenant(id),
    classroom_id int           NOT NULL REFERENCES school.classroom(id),
    subject_id   int           NOT NULL REFERENCES school.subject(id),
    staff_id     int           NOT NULL REFERENCES school.staff(id),
    title        varchar(200)  NOT NULL,
    description  text,
    due_date     TIMESTAMPTZ   NOT NULL,
    max_score    numeric(6,2)  DEFAULT 10,
    attachment_url varchar(500),
    assignment_type VARCHAR(30) DEFAULT 'homework',
    submission_type VARCHAR(30) DEFAULT 'both',
    max_attempts INT DEFAULT 1,
    allow_late BOOLEAN DEFAULT FALSE,
    auto_close BOOLEAN DEFAULT TRUE,
    is_graded BOOLEAN DEFAULT TRUE,
    rubric TEXT,
    is_deleted   BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_homework_classroom ON school.homework (classroom_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS school.homework_submission (
    id            serial       NOT NULL,
    tenant_id     int          NOT NULL REFERENCES auth.tenant(id),
    homework_id   int          NOT NULL REFERENCES school.homework(id),
    student_id    int          NOT NULL REFERENCES school.student(id),
    submitted_at  TIMESTAMPTZ,
    score         numeric(6,2),
    remarks       text,
    attachment_url varchar(500),
    status        varchar(20)  NOT NULL DEFAULT 'pending',  -- pending, submitted, graded, late
    is_deleted    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_submission UNIQUE (homework_id, student_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Staff Leave
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.staff_leave (
    id           serial       NOT NULL,
    tenant_id    int          NOT NULL REFERENCES auth.tenant(id),
    staff_id     int          NOT NULL REFERENCES school.staff(id),
    leave_type   varchar(30)  NOT NULL DEFAULT 'casual',  -- casual, sick, earned, maternity
    start_date   DATE         NOT NULL,
    end_date     DATE         NOT NULL,
    reason       text,
    status       varchar(20)  NOT NULL DEFAULT 'pending',  -- pending, approved, rejected
    approved_by  int          REFERENCES school.staff(id),
    approved_at  TIMESTAMPTZ,
    is_deleted   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Announcement  (school-wide or class-scoped)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.announcement (
    id           serial        NOT NULL,
    tenant_id    int           NOT NULL REFERENCES auth.tenant(id),
    classroom_id int           REFERENCES school.classroom(id),  -- NULL = school-wide
    title        varchar(200)  NOT NULL,
    content      text          NOT NULL,
    published_by int           NOT NULL REFERENCES school.staff(id),
    publish_date DATE          NOT NULL DEFAULT CURRENT_DATE,
    expiry_date  DATE,
    is_deleted   BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_tenant ON school.announcement (tenant_id, publish_date) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Event  (calendar events)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.event (
    id          serial        NOT NULL,
    tenant_id   int           NOT NULL REFERENCES auth.tenant(id),
    title       varchar(200)  NOT NULL,
    description text,
    event_type  varchar(30)   NOT NULL DEFAULT 'general',  -- holiday, exam, sports, cultural
    start_date  DATE          NOT NULL,
    end_date    DATE          NOT NULL,
    is_deleted  BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_event_tenant ON school.event (tenant_id, start_date) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Document  (report cards, certificates, etc.)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.document (
    id           serial       NOT NULL,
    tenant_id    int          NOT NULL REFERENCES auth.tenant(id),
    student_id   int          REFERENCES school.student(id),
    staff_id     int          REFERENCES school.staff(id),
    doc_type     varchar(50)  NOT NULL,               -- report_card, certificate, id_card
    title        varchar(200) NOT NULL,
    file_url     varchar(500) NOT NULL,
    file_size    int,
    mime_type    varchar(100),
    uploaded_by  int          REFERENCES school.staff(id),
    is_deleted   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_document_student ON school.document (student_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Guardian
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.guardian (
    id              serial        NOT NULL,
    tenant_id       int           NOT NULL REFERENCES auth.tenant(id),
    user_id         int           NOT NULL REFERENCES auth.user(id),
    first_name      varchar(100)  NOT NULL,
    last_name       varchar(100),
    gender          varchar(10),
    phone           varchar(20),
    email           citext        NOT NULL,
    address         text,
    occupation      varchar(100),
    avatar_url      varchar(500),
    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_guardian_tenant_user UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_guardian_tenant ON school.guardian (tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_guardian_user ON school.guardian (user_id) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Student-Guardian Mapping (M:N)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.student_guardian (
    id              serial      NOT NULL,
    tenant_id       int         NOT NULL REFERENCES auth.tenant(id),
    student_id      int         NOT NULL REFERENCES school.student(id),
    guardian_id     int         NOT NULL REFERENCES school.guardian(id),
    relation        varchar(50) NOT NULL, -- Father, Mother, Brother, etc.
    is_emergency    BOOLEAN     NOT NULL DEFAULT FALSE,
    is_deleted      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_student_guardian UNIQUE (student_id, guardian_id)
);
