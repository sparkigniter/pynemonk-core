-- init.sql
-- Runs automatically inside the pynemonk_core database on first container boot.

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS auth;

-- ─────────────────────────────────────────────────────────────────────────────
-- Packages (pricing tiers)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.package (
    id          serial       NOT NULL,
    name        varchar(100) NOT NULL,
    slug        varchar(100) NOT NULL UNIQUE,
    description text,
    price_usd   numeric(10,2) NOT NULL DEFAULT 0,
    features    jsonb        NOT NULL DEFAULT '[]',
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Seed default packages
INSERT INTO auth.package (name, slug, description, price_usd, features) VALUES
    ('Standard',    'standard',    'Perfect for small schools',          49.00,  '["Up to 500 students","5 staff accounts","Attendance tracking","Basic reports"]'),
    ('Premium',     'premium',     'Ideal for mid-size institutions',    99.00,  '["Up to 2000 students","25 staff accounts","All Standard features","Finance module","Parent portal"]'),
    ('Enterprise',  'enterprise',  'Full-featured for large districts',  199.00, '["Unlimited students","Unlimited staff","All Premium features","Custom branding","Dedicated support","API access"]')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tenants (schools)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.tenant (
    id           serial       NOT NULL,
    uuid         uuid         NOT NULL DEFAULT gen_random_uuid(),
    name         varchar(255) NOT NULL,
    slug         varchar(255) NOT NULL UNIQUE,
    email        citext       NOT NULL UNIQUE,
    phone        varchar(30),
    address      text,
    city         varchar(100),
    state        varchar(100),
    country      varchar(100),
    package_id   int          NOT NULL,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    is_deleted   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_tenant_package FOREIGN KEY (package_id) REFERENCES auth.package(id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- OAuth2 tables
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.client (
    id            serial  NOT NULL,
    tenant_id     int     REFERENCES auth.tenant(id),
    name          varchar NOT NULL,
    description   text,
    client_id     varchar NOT NULL,
    client_secret varchar NOT NULL,
    is_deleted    BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS auth.scope (
    id          serial  NOT NULL,
    tenant_id   int     REFERENCES auth.tenant(id),
    value       varchar NOT NULL,
    description text,
    is_deleted  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS auth.claim (
    id          serial  NOT NULL,
    tenant_id   int     REFERENCES auth.tenant(id),
    value       varchar NOT NULL,
    description text,
    is_deleted  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS auth.client_scope (
    id          serial NOT NULL,
    tenant_id   int    REFERENCES auth.tenant(id),
    client_id   int    NOT NULL,
    scope_id    int    NOT NULL,
    is_deleted  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS auth.client_claim (
    id          serial NOT NULL,
    tenant_id   int    REFERENCES auth.tenant(id),
    client_id   int    NOT NULL,
    claim_id    int    NOT NULL,
    is_deleted  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS auth.role (
    id          serial       NOT NULL,
    tenant_id   int          REFERENCES auth.tenant(id),
    slug        varchar(60)  NOT NULL DEFAULT '',
    name        varchar(100) NOT NULL,
    description text,
    tier        smallint     NOT NULL DEFAULT 3,
    is_system   boolean      NOT NULL DEFAULT TRUE,
    data_scope  jsonb        NOT NULL DEFAULT '[]',
    is_deleted  BOOLEAN      DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id)
);

-- Unique slug per tenant (enforced after column exists)
CREATE UNIQUE INDEX IF NOT EXISTS uq_role_tenant_slug
    ON auth.role (tenant_id, slug)
    WHERE is_deleted = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_role_tenant_name
    ON auth.role (tenant_id, name)
    WHERE (is_deleted = false);
CREATE TABLE IF NOT EXISTS auth.user (
    id          serial  NOT NULL,
    tenant_id   int     REFERENCES auth.tenant(id),
    email       citext  NOT NULL UNIQUE,
    role_id     int     NOT NULL,
    is_deleted  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_user_role_id_ref_role_id FOREIGN KEY (role_id) REFERENCES auth.role(id)
);

CREATE TABLE IF NOT EXISTS auth.user_profile (
    id            serial  NOT NULL,
    tenant_id     int     REFERENCES auth.tenant(id),
    user_id       int     NOT NULL,
    first_name    varchar,
    last_name     varchar,
    phone         varchar,
    date_of_birth DATE,
    is_deleted    BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    CONSTRAINT fk_user_profile_user_id_ref_user_id FOREIGN KEY (user_id) REFERENCES auth.user(id)
);

CREATE TABLE IF NOT EXISTS auth.user_credential (
    id            serial  NOT NULL,
    tenant_id     int     REFERENCES auth.tenant(id),
    user_id       int     NOT NULL,
    password_hash varchar NOT NULL,
    is_deleted    BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    CONSTRAINT fk_user_credential_user_id FOREIGN KEY (user_id) REFERENCES auth.user(id)
);

CREATE TABLE IF NOT EXISTS auth.refresh_token (
    id         serial      NOT NULL,
    tenant_id  int         REFERENCES auth.tenant(id),
    user_id    int         NOT NULL,
    client_id  int         NOT NULL DEFAULT 0,
    token      text        NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    CONSTRAINT fk_refresh_token_user_id FOREIGN KEY (user_id) REFERENCES auth.user(id)
);

-- ── User Roles (Many-to-Many) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.user_role (
    id          serial      NOT NULL,
    user_id     int         NOT NULL REFERENCES auth.user(id),
    role_id     int         NOT NULL REFERENCES auth.role(id),
    is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
    is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_role_user ON auth.user_role (user_id) WHERE is_deleted = FALSE;

-- ── Unique client_id constraint ──────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_client_id ON auth.client (client_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Role template catalogue (tenant-independent reference table)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.role_template (
    id          serial      NOT NULL,
    slug        varchar(60) NOT NULL UNIQUE,
    name        varchar(100) NOT NULL,
    description text        NOT NULL,
    tier        smallint    NOT NULL,
    is_system   boolean     NOT NULL DEFAULT TRUE,
    data_scope  jsonb       NOT NULL DEFAULT '[]',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

INSERT INTO auth.role_template (slug, name, description, tier, is_system, data_scope)
VALUES
    ('owner', 'Account Owner', 'The person or entity that registered the school. Controls billing, subscription plan, and can invite school-level admins. Has NO access to student or staff academic/personal data by default.', 0, TRUE, '["billing:read","billing:write","settings:read","settings:write","user:invite","user:deactivate","plan:change"]'::jsonb),
    ('principal', 'Principal', 'Head of the school. Full read access to all academic, attendance, disciplinary, and limited financial data. Cannot change billing or technical settings.', 1, TRUE, '["student:read","student.academic:read","student.academic:write","student.attendance:read","student.attendance:write","student.disciplinary:read","student.disciplinary:write","staff:read","staff.academic:read","class:read","class:write","report:read","report:export","fee.summary:read"]'::jsonb),
    ('vice_principal', 'Vice Principal', 'Deputy head. Same data scope as Principal by default.', 1, TRUE, '["student:read","student.academic:read","student.academic:write","student.attendance:read","student.attendance:write","student.disciplinary:read","student.disciplinary:write","staff:read","class:read","class:write","report:read"]'::jsonb),
    ('school_admin', 'School Administrator', 'Office/operations staff. Manages day-to-day: enrolment, timetables, user accounts, general records.', 2, TRUE, '["student:read","student:write","student.attendance:read","student.attendance:write","staff:read","staff:write","class:read","class:write","timetable:read","timetable:write","user:invite","announcement:write"]'::jsonb),
    ('accountant', 'Accountant / Fee Manager', 'Manages fee collection, payment records, and financial reports.', 2, TRUE, '["fee:read","fee:write","fee.collection:write","student:read","report.financial:read","report.financial:export"]'::jsonb),
    ('hr', 'HR / Staff Manager', 'Manages staff records, contracts, leave, and payroll data.', 2, FALSE, '["staff:read","staff:write","staff.leave:read","staff.leave:write","staff.payroll:read","staff.payroll:write"]'::jsonb),
    ('receptionist', 'Receptionist', 'Front-desk staff. Can look up student and parent contact info.', 2, FALSE, '["student:read","student.contact:read","parent:read","announcement:read","visitor:write"]'::jsonb),
    ('admissions_officer', 'Admissions Officer / Registrar', 'Handles student enrolments, guardian registration, and initial admission fees.', 2, TRUE, '["student:read","student:write","parent:read","parent:write","class:read","fee.collection:write"]'::jsonb),
    ('teacher', 'Teacher', 'Subject teacher. Can view and update grades and attendance ONLY for students in their assigned classes.', 3, TRUE, '["student:read","student.academic:read","student.academic:write","student.attendance:read","student.attendance:write","class:read","assignment:write","report.class:read"]'::jsonb),
    ('class_teacher', 'Class Teacher (Homeroom)', 'Homeroom / form teacher. Same as Teacher plus pastoral access.', 3, TRUE, '["student:read","student.academic:read","student.academic:write","student.attendance:read","student.attendance:write","student.disciplinary:read","class:read","assignment:write","report.class:read","parent:read"]'::jsonb),
    ('librarian', 'Librarian', 'Manages the school library: book catalogue, issue/return records.', 3, FALSE, '["library:read","library:write","student.basic:read"]'::jsonb),
    ('counselor', 'School Counsellor', 'Student wellbeing. Has access to behavioural and limited personal data.', 3, FALSE, '["student:read","student.disciplinary:read","student.disciplinary:write","student.wellbeing:read","student.wellbeing:write","student.health:read","parent:read"]'::jsonb),
    ('nurse', 'School Nurse / Medical Officer', 'Health records only. Most sensitive role.', 3, FALSE, '["student:read","student.health:read","student.health:write","student.medical_history:read","student.medical_history:write"]'::jsonb),
    ('student', 'Student', 'Enrolled student portal access.', 4, TRUE, '["self.academic:read","self.attendance:read","self.timetable:read","self.assignment:read","self.fee:read","announcement:read"]'::jsonb),
    ('parent', 'Parent / Guardian', 'Parent/guardian portal. Can view their linked child''s records only.', 4, TRUE, '["child.academic:read","child.attendance:read","child.timetable:read","child.fee:read","child.disciplinary:read","announcement:read","teacher.contact:read"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Permission catalogue
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.permission (
    id           serial      NOT NULL,
    key          varchar(100) NOT NULL UNIQUE,
    description  text,
    tier         smallint    NOT NULL DEFAULT 3,
    requires_mfa boolean     NOT NULL DEFAULT FALSE,
    is_audited   boolean     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

INSERT INTO auth.permission (key, description, tier, requires_mfa, is_audited)
VALUES
    ('billing:read', 'View billing information', 0, FALSE, FALSE),
    ('billing:write', 'Manage billing / payment methods', 0, TRUE, TRUE),
    ('settings:read', 'View school settings', 0, FALSE, FALSE),
    ('settings:write', 'Update school settings', 0, FALSE, TRUE),
    ('plan:change', 'Change subscription plan', 0, TRUE, TRUE),
    ('user:invite', 'Invite new users', 2, FALSE, TRUE),
    ('user:deactivate', 'Deactivate user accounts', 2, FALSE, TRUE),
    ('student:read', 'View basic student list / profile', 2, FALSE, FALSE),
    ('student:write', 'Create / update student records', 2, FALSE, TRUE),
    ('student.basic:read', 'View student name and class only', 3, FALSE, FALSE),
    ('student.contact:read', 'View student contact information', 2, FALSE, FALSE),
    ('student.academic:read', 'View grades and academic records', 2, FALSE, FALSE),
    ('student.academic:write', 'Update grades and academic records', 2, FALSE, TRUE),
    ('student.attendance:read', 'View attendance records', 2, FALSE, FALSE),
    ('student.attendance:write', 'Record / update attendance', 3, FALSE, TRUE),
    ('student.disciplinary:read', 'View disciplinary notes', 2, FALSE, TRUE),
    ('student.disciplinary:write', 'Create disciplinary records', 2, FALSE, TRUE),
    ('student.wellbeing:read', 'View counselling / wellbeing records', 2, TRUE, TRUE),
    ('student.wellbeing:write', 'Update wellbeing records', 2, TRUE, TRUE),
    ('student.health:read', 'View health / medical records', 1, TRUE, TRUE),
    ('student.health:write', 'Update health records', 1, TRUE, TRUE),
    ('student.medical_history:read', 'View full medical history', 1, TRUE, TRUE),
    ('student.medical_history:write', 'Update medical history', 1, TRUE, TRUE),
    ('staff:read', 'View staff list and profile', 2, FALSE, FALSE),
    ('staff:write', 'Create / update staff records', 2, FALSE, TRUE),
    ('staff.academic:read', 'View teacher academic assignments', 2, FALSE, FALSE),
    ('staff.leave:read', 'View staff leave records', 2, FALSE, FALSE),
    ('staff.leave:write', 'Manage staff leave', 2, FALSE, TRUE),
    ('staff.payroll:read', 'View payroll records', 1, TRUE, TRUE),
    ('staff.payroll:write', 'Update payroll records', 1, TRUE, TRUE),
    ('class:read', 'View class / section list', 3, FALSE, FALSE),
    ('class:write', 'Create / update classes', 2, FALSE, TRUE),
    ('timetable:read', 'View timetables', 3, FALSE, FALSE),
    ('timetable:write', 'Update timetables', 2, FALSE, TRUE),
    ('assignment:write', 'Create / grade assignments', 3, FALSE, TRUE),
    ('fee:read', 'View fee structures', 2, FALSE, FALSE),
    ('fee:write', 'Update fee structures', 2, FALSE, TRUE),
    ('fee.collection:write', 'Record fee payments', 2, FALSE, TRUE),
    ('fee.summary:read', 'View aggregated fee summary', 2, FALSE, FALSE),
    ('report:read', 'View standard reports', 2, FALSE, FALSE),
    ('report:export', 'Export reports (PDF/CSV)', 2, FALSE, TRUE),
    ('report.class:read', 'View own class reports', 3, FALSE, FALSE),
    ('report.financial:read', 'View financial reports', 2, FALSE, TRUE),
    ('report.financial:export', 'Export financial reports', 2, TRUE, TRUE),
    ('announcement:read', 'Read announcements', 4, FALSE, FALSE),
    ('announcement:write', 'Post announcements', 2, FALSE, FALSE),
    ('teacher.contact:read', 'View teacher contact details', 4, FALSE, FALSE),
    ('parent:read', 'View parent / guardian info', 3, FALSE, FALSE),
    ('parent:write', 'Create / update parent guardian info', 2, FALSE, TRUE),
    ('library:read', 'View library catalogue', 3, FALSE, FALSE),
    ('library:write', 'Manage library issue / return', 3, FALSE, FALSE),
    ('visitor:write', 'Log visitor records', 2, FALSE, FALSE),
    ('self.academic:read', 'Student: view own grades', 4, FALSE, FALSE),
    ('self.attendance:read', 'Student: view own attendance', 4, FALSE, FALSE),
    ('self.timetable:read', 'Student: view own timetable', 4, FALSE, FALSE),
    ('self.assignment:read', 'Student: view own assignments', 4, FALSE, FALSE),
    ('self.fee:read', 'Student: view own fee status', 4, FALSE, FALSE),
    ('child.academic:read', 'Parent: view linked child grades', 4, FALSE, FALSE),
    ('child.attendance:read', 'Parent: view linked child attendance', 4, FALSE, FALSE),
    ('child.timetable:read', 'Parent: view linked child timetable', 4, FALSE, FALSE),
    ('child.fee:read', 'Parent: view linked child fees', 4, FALSE, FALSE),
    ('child.disciplinary:read', 'Parent: view limited disciplinary info', 4, FALSE, FALSE)
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Role ↔ Permission join table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.role_permission (
    id          serial  NOT NULL,
    tenant_id   int     REFERENCES auth.tenant(id),  -- NULL = global template
    role_id     int     NOT NULL REFERENCES auth.role(id),
    permission_id int   NOT NULL REFERENCES auth.permission(id),
    granted     boolean NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (role_id, permission_id)
);

-- ── Seed default frontend client ──────────────────────────────────────────────
INSERT INTO auth.client (name, description, client_id, client_secret)
VALUES (
    'Pynemonk Web Frontend',
    'Main web interface for the school management system',
    '03458d1b77bf121e',
    '838086db215b5a9dca34194d3d5d3fbe'
)
ON CONFLICT (client_id) DO NOTHING;
