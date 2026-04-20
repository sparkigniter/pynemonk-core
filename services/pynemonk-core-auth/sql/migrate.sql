-- migrate.sql
-- Definitions for the school schema and its associated tables.

CREATE SCHEMA IF NOT EXISTS school;

-- ── Classroom ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.classroom (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    section VARCHAR(50),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Course ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.course (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Staff ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.staff (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    user_id INT NOT NULL,
    employee_code VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    gender VARCHAR(20),
    date_of_birth DATE,
    phone VARCHAR(30),
    address TEXT,
    qualification TEXT,
    specialization TEXT,
    joining_date DATE,
    designation VARCHAR(100),
    avatar_url TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Student ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.student (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    user_id INT NOT NULL,
    admission_no VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    gender VARCHAR(20),
    date_of_birth DATE,
    blood_group VARCHAR(10),
    nationality VARCHAR(50),
    religion VARCHAR(50),
    phone VARCHAR(30),
    address TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Guardian ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.guardian (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    user_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(100),
    address TEXT,
    occupation VARCHAR(100),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Student Guardian Linking ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.student_guardian (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    student_id INT NOT NULL REFERENCES school.student(id),
    guardian_id INT NOT NULL REFERENCES school.guardian(id),
    relation VARCHAR(50),
    is_emergency BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, guardian_id)
);

-- ── Enrollment ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school.student_enrollment (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    student_id INT NOT NULL REFERENCES school.student(id),
    classroom_id INT NOT NULL REFERENCES school.classroom(id),
    academic_year_id INT NOT NULL,
    roll_number VARCHAR(20),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, academic_year_id)
);
