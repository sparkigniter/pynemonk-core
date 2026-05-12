-- ─────────────────────────────────────────────────────────────────────────────
-- Pynemonk Auth Module — Consolidated Migration (Schema + Structural Data)
-- Purpose: Defines the entire IAM, Tenancy, and OAuth2 architecture in a single file.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS auth;

-- 1. Core Tables (Tenancy & Packages)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auth.package (
    id          serial       NOT NULL PRIMARY KEY,
    name        varchar(100) NOT NULL,
    slug        varchar(100) NOT NULL UNIQUE,
    description text,
    price_usd   numeric(10,2) NOT NULL DEFAULT 0,
    features    jsonb        NOT NULL DEFAULT '[]',
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth.tenant (
    id           serial       NOT NULL PRIMARY KEY,
    uuid         uuid         NOT NULL DEFAULT gen_random_uuid(),
    name         varchar(255) NOT NULL,
    slug         varchar(255) NOT NULL UNIQUE,
    email        citext       NOT NULL UNIQUE,
    phone        varchar(30),
    address      text,
    city         varchar(100),
    state        varchar(100),
    country      varchar(100),
    package_id   int          NOT NULL REFERENCES auth.package(id),
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    is_deleted   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth.tenant_setting (
    id          serial       NOT NULL PRIMARY KEY,
    tenant_id   int          NOT NULL REFERENCES auth.tenant(id) ON DELETE CASCADE,
    key         varchar(100) NOT NULL,
    value       text         NOT NULL,
    is_public   boolean      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, key)
);

-- 2. OAuth2 & Identity Tables
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auth.client (
    id            serial  NOT NULL PRIMARY KEY,
    tenant_id     int     REFERENCES auth.tenant(id),
    name          varchar NOT NULL,
    description   text,
    client_id     varchar NOT NULL UNIQUE,
    client_secret varchar NOT NULL,
    redirect_uris TEXT[]  DEFAULT '{}',
    grant_types   TEXT[]  DEFAULT '{"authorization_code", "refresh_token"}',
    is_active     BOOLEAN DEFAULT TRUE,
    is_internal   BOOLEAN DEFAULT FALSE,
    is_deleted    BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth.scope (
    id          serial  NOT NULL PRIMARY KEY,
    tenant_id   int     REFERENCES auth.tenant(id),
    value       varchar NOT NULL UNIQUE,
    description text,
    is_deleted  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth.permission (
    id           serial      NOT NULL PRIMARY KEY,
    key          varchar(100) NOT NULL UNIQUE,
    description  text,
    tier         smallint    NOT NULL DEFAULT 3,
    requires_mfa boolean     NOT NULL DEFAULT FALSE,
    is_audited   boolean     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth.role_template (
    id          serial      NOT NULL PRIMARY KEY,
    slug        varchar(60) NOT NULL,
    name        varchar(100) NOT NULL,
    description text        NOT NULL,
    tier        smallint    NOT NULL,
    is_system   boolean     NOT NULL DEFAULT TRUE,
    data_scope  jsonb       NOT NULL DEFAULT '[]',
    client_id   integer     REFERENCES auth.client(id),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Use a partial unique index for the case where client_id is NULL (Template Roles)
DROP INDEX IF EXISTS auth.uq_role_template_client_slug;
CREATE UNIQUE INDEX IF NOT EXISTS uq_role_template_client_slug ON auth.role_template (slug) WHERE client_id IS NULL;
-- Use another partial index for client-specific roles
CREATE UNIQUE INDEX IF NOT EXISTS uq_role_template_client_specific_slug ON auth.role_template (slug, client_id) WHERE client_id IS NOT NULL;


CREATE TABLE IF NOT EXISTS auth.role (
    id          serial       NOT NULL PRIMARY KEY,
    tenant_id   int          REFERENCES auth.tenant(id),
    slug        varchar(60)  NOT NULL DEFAULT '',
    name        varchar(100) NOT NULL,
    description text,
    tier        smallint     NOT NULL DEFAULT 3,
    is_system   boolean      NOT NULL DEFAULT TRUE,
    data_scope  jsonb        NOT NULL DEFAULT '[]',
    is_deleted  BOOLEAN      DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_role_tenant_slug ON auth.role (tenant_id, slug) WHERE is_deleted = FALSE;

-- 3. Junction & Relationship Tables
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auth.role_permission (
    id            serial  NOT NULL PRIMARY KEY,
    tenant_id     int     REFERENCES auth.tenant(id),
    role_id       int     NOT NULL REFERENCES auth.role(id) ON DELETE CASCADE,
    permission_id int     NOT NULL REFERENCES auth.permission(id) ON DELETE CASCADE,
    granted       boolean NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS auth.role_scope (
    id          serial   NOT NULL PRIMARY KEY,
    tenant_id   int      REFERENCES auth.tenant(id),
    role_id     int      NOT NULL REFERENCES auth.role(id) ON DELETE CASCADE,
    scope_id    int      NOT NULL REFERENCES auth.scope(id) ON DELETE CASCADE,
    granted     boolean  NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_id, scope_id)
);

CREATE TABLE IF NOT EXISTS auth.client_scope (
    id          serial NOT NULL PRIMARY KEY,
    tenant_id   int    REFERENCES auth.tenant(id),
    client_id   int    NOT NULL REFERENCES auth.client(id) ON DELETE CASCADE,
    scope_id    int    NOT NULL REFERENCES auth.scope(id) ON DELETE CASCADE,
    is_deleted  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (client_id, scope_id)
);

CREATE TABLE IF NOT EXISTS auth.client_role (
    id          serial PRIMARY KEY,
    tenant_id   int    REFERENCES auth.tenant(id),
    client_id   int    NOT NULL REFERENCES auth.client(id) ON DELETE CASCADE,
    role_id     int    NOT NULL REFERENCES auth.role(id) ON DELETE CASCADE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, role_id)
);

CREATE TABLE IF NOT EXISTS auth.client_role_scope (
    id          serial PRIMARY KEY,
    client_id   INTEGER NOT NULL REFERENCES auth.client(id) ON DELETE CASCADE,
    role_id     INTEGER NOT NULL REFERENCES auth.role(id) ON DELETE CASCADE,
    scope_id    INTEGER NOT NULL REFERENCES auth.scope(id) ON DELETE CASCADE,
    granted     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (client_id, role_id, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_crs_client_role ON auth.client_role_scope (client_id, role_id);

-- 4. User & Credential Tables
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auth.user (
    id          serial  NOT NULL PRIMARY KEY,
    tenant_id   int     REFERENCES auth.tenant(id),
    email       citext  NOT NULL UNIQUE,
    role_id     int     NOT NULL REFERENCES auth.role(id),
    is_deleted  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth.user_profile (
    id            serial  NOT NULL PRIMARY KEY,
    tenant_id     int     REFERENCES auth.tenant(id),
    user_id       int     NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
    first_name    varchar,
    last_name     varchar,
    phone         varchar,
    date_of_birth DATE,
    is_deleted    BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth.user_credential (
    id            serial  NOT NULL PRIMARY KEY,
    tenant_id     int     REFERENCES auth.tenant(id),
    user_id       int     NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
    password_hash varchar NOT NULL,
    is_deleted    BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_credential_user_id UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS auth.refresh_token (
    id         serial      NOT NULL PRIMARY KEY,
    tenant_id  int         REFERENCES auth.tenant(id),
    user_id    int         NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
    client_id  int         NOT NULL DEFAULT 0,
    token      text        NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth.user_role (
    id          serial      NOT NULL PRIMARY KEY,
    user_id     int         NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
    role_id     int         NOT NULL REFERENCES auth.role(id) ON DELETE CASCADE,
    is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
    is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

-- 5. Structural Data (Packages, Templates, Scopes)
-- ─────────────────────────────────────────────────────────────────────────────

-- Standard Packages
INSERT INTO auth.package (name, slug, description, price_usd, features) VALUES
    ('Standard',    'standard',    'Perfect for small schools',          49.00,  '["Up to 500 students","5 staff accounts","Attendance tracking","Basic reports"]'),
    ('Premium',     'premium',     'Ideal for mid-size institutions',    99.00,  '["Up to 2000 students","25 staff accounts","All Standard features","Finance module","Parent portal"]'),
    ('Enterprise',  'enterprise',  'Full-featured for large districts',  199.00, '["Unlimited students","Unlimited staff","All Premium features","Custom branding","Dedicated support","API access"]')
ON CONFLICT (slug) DO NOTHING;

-- Master Permission List
INSERT INTO auth.permission (key, description, tier, requires_mfa, is_audited) VALUES
    ('billing:read', 'View billing information', 0, FALSE, FALSE),
    ('billing:write', 'Manage billing / payment methods', 0, TRUE, TRUE),
    ('settings:read', 'View school settings', 0, FALSE, FALSE),
    ('settings:write', 'Update school settings', 0, FALSE, TRUE),
    ('plan:change', 'Change subscription plan', 0, TRUE, TRUE),
    ('user:invite', 'Invite new users', 2, FALSE, TRUE),
    ('user:deactivate', 'Deactivate user accounts', 2, FALSE, TRUE),
    ('student:read', 'View student list / profile', 2, FALSE, FALSE),
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
    ('assignment:read', 'View assignments', 3, FALSE, FALSE),
    ('assignment:write', 'Create / grade assignments', 3, FALSE, TRUE),
    ('exam:read', 'View exams', 3, FALSE, FALSE),
    ('exam:write', 'Manage exams', 2, FALSE, TRUE),
    ('mark:read', 'View marks', 3, FALSE, FALSE),
    ('mark:write', 'Manage marks', 2, FALSE, TRUE),
    ('fee:read', 'View fee structures', 2, FALSE, FALSE),
    ('fee:write', 'Update fee structures', 2, FALSE, TRUE),
    ('fee.collection:write', 'Record fee payments', 2, FALSE, TRUE),
    ('fee.summary:read', 'View aggregated fee summary', 2, FALSE, FALSE),
    ('report:read', 'View standard reports', 2, FALSE, FALSE),
    ('report:export', 'Export reports (PDF/CSV)', 2, FALSE, TRUE),
    ('report.class:read', 'View own class reports', 3, FALSE, FALSE),
    ('report.financial:read', 'View financial reports', 2, FALSE, TRUE),
    ('report.financial:export', 'Export financial reports', 2, TRUE, TRUE),
    ('coa:read', 'View Chart of Accounts', 2, FALSE, FALSE),
    ('coa:write', 'Manage Chart of Accounts', 2, TRUE, TRUE),
    ('journal:read', 'View Journal Entries', 2, FALSE, FALSE),
    ('journal:write', 'Post Journal Entries', 2, TRUE, TRUE),
    ('invoice:read', 'View Fee Invoices', 2, FALSE, FALSE),
    ('invoice:write', 'Manage Fee Invoices', 2, TRUE, TRUE),
    ('payment:read', 'View Fee Payments', 2, FALSE, FALSE),
    ('payment:write', 'Record Fee Payments', 2, TRUE, TRUE),
    ('accounting:read', 'General Accounting Access', 2, FALSE, FALSE),
    ('announcement:read', 'Read announcements', 4, FALSE, FALSE),
    ('announcement:write', 'Post announcements', 2, FALSE, FALSE),
    ('teacher_note:read', 'Read teacher notes', 3, FALSE, FALSE),
    ('teacher_note:write', 'Write teacher notes', 3, FALSE, FALSE),
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
    ('child.disciplinary:read', 'Parent: view limited disciplinary info', 4, FALSE, FALSE),
    ('system:manage', 'Full system administration access', 0, TRUE, TRUE),
    ('system:settings', 'View/Update global platform settings', 0, TRUE, TRUE)
ON CONFLICT (key) DO NOTHING;

-- Populate Scopes from Permissions
INSERT INTO auth.scope (value, description)
SELECT key, description FROM auth.permission
ON CONFLICT (value) DO NOTHING;

-- Role Templates
-- Using a DO block to handle upsert with nullable client_id safely
DO $$
DECLARE
    r RECORD;
    templates JSONB := '[
        {"slug": "owner", "name": "Account Owner", "desc": "The person or entity that registered the school.", "tier": 0, "scope": ["billing:read","billing:write","settings:read","settings:write","user:invite","user:deactivate","plan:change","coa:read","coa:write","journal:read","journal:write","invoice:read","invoice:write","payment:read","payment:write","accounting:read","student:read"]},
        {"slug": "principal", "name": "Principal", "desc": "Head of the school.", "tier": 1, "scope": ["student:read","student.academic:read","student.academic:write","student.attendance:read","student.attendance:write","student.disciplinary:read","student.disciplinary:write","staff:read","staff.academic:read","class:read","class:write","report:read","report:export","fee.summary:read","coa:read","journal:read","invoice:read","payment:read","accounting:read","settings:read"]},
        {"slug": "vice_principal", "name": "Vice Principal", "desc": "Deputy head.", "tier": 1, "scope": ["student:read","student.academic:read","student.academic:write","student.attendance:read","student.attendance:write","student.disciplinary:read","student.disciplinary:write","staff:read","class:read","class:write","report:read","coa:read","journal:read","invoice:read","payment:read","accounting:read","settings:read"]},
        {"slug": "school_admin", "name": "School Administrator", "desc": "Office/operations staff.", "tier": 2, "scope": ["student:read","student:write","student.attendance:read","student.attendance:write","staff:read","staff:write","class:read","class:write","timetable:read","timetable:write","user:invite","user:deactivate","announcement:write","settings:read","settings:write","report:read","report:export","coa:read","journal:read","invoice:read","invoice:write","payment:read","payment:write","accounting:read"]},
        {"slug": "accountant", "name": "Accountant / Fee Manager", "desc": "Manages financial operations.", "tier": 2, "scope": ["fee:read","fee:write","fee.collection:write","student:read","report.financial:read","report.financial:export","coa:read","coa:write","journal:read","journal:write","invoice:read","invoice:write","payment:read","payment:write","accounting:read","settings:read"]},
        {"slug": "teacher", "name": "Teacher", "desc": "Subject teacher.", "tier": 3, "scope": ["student:read","student.academic:read","student.academic:write","student.attendance:read","student.attendance:write","class:read","assignment:read","assignment:write","exam:read","exam:write","mark:read","mark:write","report.class:read","teacher_note:read","teacher_note:write","timetable:read","staff:read","staff.academic:read"]},
        {"slug": "student", "name": "Student", "desc": "Enrolled student.", "tier": 4, "scope": ["self.academic:read","self.attendance:read","self.timetable:read","self.assignment:read","self.fee:read","announcement:read"]},
        {"slug": "parent", "name": "Parent / Guardian", "desc": "Parent/guardian portal.", "tier": 4, "scope": ["child.academic:read","child.attendance:read","child.timetable:read","child.fee:read","child.disciplinary:read","announcement:read","teacher.contact:read"]},
        {"slug": "system_admin", "name": "System Administrator", "desc": "Platform-wide administrator.", "tier": 0, "scope": ["system:manage","system:settings"]}
    ]'::jsonb;
BEGIN
    FOR r IN SELECT * FROM jsonb_to_recordset(templates) AS x(slug text, name text, "desc" text, tier int, scope jsonb) LOOP
        INSERT INTO auth.role_template (slug, name, description, tier, is_system, data_scope, client_id)
        VALUES (r.slug, r.name, r.desc, r.tier, TRUE, r.scope, NULL)
        ON CONFLICT (slug) WHERE client_id IS NULL DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            tier = EXCLUDED.tier,
            data_scope = EXCLUDED.data_scope;
    END LOOP;
END $$;

-- 6. System Clients
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO auth.client (name, description, client_id, client_secret, is_internal, grant_types) VALUES
    ('Pynemonk Web Frontend', 'Main web interface', '03458d1b77bf121e', '838086db215b5a9dca34194d3d5d3fbe', TRUE, '{"password", "authorization_code", "refresh_token"}'),
    ('Main Frontend Client', 'Development client', 'frontend_client', 'frontend_secret', TRUE, '{"password", "authorization_code", "refresh_token"}'),
    ('Mobile Application', 'Teacher/Parent Mobile App', 'mobile_app', 'mobile_secret', TRUE, '{"password", "refresh_token"}')
ON CONFLICT (client_id) DO UPDATE SET
    is_internal = EXCLUDED.is_internal,
    grant_types = EXCLUDED.grant_types;

-- 7. Functions & Procedures (The "Engine")
-- ─────────────────────────────────────────────────────────────────────────────

-- Function: Sync Internal Client Scopes (Whitelist)
CREATE OR REPLACE FUNCTION auth.proc_sync_internal_client_scopes()
RETURNS VOID AS $$
BEGIN
    -- 1. Whitelist all scopes for internal clients
    INSERT INTO auth.client_scope (client_id, scope_id)
    SELECT c.id, s.id
    FROM auth.client c, auth.scope s
    WHERE c.is_internal = TRUE
    ON CONFLICT DO NOTHING;

    -- 2. Whitelist standard roles for internal clients (Access Control)
    INSERT INTO auth.client_role (client_id, role_id)
    SELECT c.id, r.id
    FROM auth.client c, auth.role r
    WHERE c.is_internal = TRUE
    AND (r.is_system = TRUE OR r.slug IN ('system_admin', 'owner', 'school_admin', 'teacher', 'accountant', 'parent', 'student'))
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function: Publish IAM State (Templates -> Live Roles)
CREATE OR REPLACE FUNCTION auth.proc_publish_iam_state()
RETURNS VOID AS $$
DECLARE
    r_template RECORD;
    v_perm_key TEXT;
    v_client_id INT;
BEGIN
    -- A. Propagate Template permissions to all Tenant Roles
    INSERT INTO auth.role_permission (tenant_id, role_id, permission_id)
    SELECT r.tenant_id, r.id, p.id
    FROM auth.role r
    JOIN auth.role_template rt ON r.slug = rt.slug
    CROSS JOIN LATERAL jsonb_array_elements_text(rt.data_scope) as scope_key
    JOIN auth.permission p ON p.key = scope_key
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- B. Sync to Triadic JWT Layer (client_role_scope) for Internal Clients
    FOR v_client_id IN SELECT id FROM auth.client WHERE is_internal = TRUE LOOP
        INSERT INTO auth.client_role_scope (client_id, role_id, scope_id)
        SELECT v_client_id, r.id, s.id
        FROM auth.role r
        JOIN auth.role_template rt ON r.slug = rt.slug
        CROSS JOIN LATERAL jsonb_array_elements_text(rt.data_scope) as scope_key
        JOIN auth.scope s ON s.value = scope_key
        ON CONFLICT (client_id, role_id, scope_id) DO UPDATE SET granted = TRUE;
    END LOOP;

    -- C. Sync Whitelists
    PERFORM auth.proc_sync_internal_client_scopes();
END;
$$ LANGUAGE plpgsql;

-- Global System Admin Role
INSERT INTO auth.role (tenant_id, slug, name, description, tier, is_system, data_scope)
VALUES (NULL, 'system_admin', 'System Administrator', 'Platform-wide administrator', 0, TRUE, '["system:manage","system:settings"]')
ON CONFLICT (slug) WHERE tenant_id IS NULL AND is_deleted = FALSE DO NOTHING;

-- Run initial sync
SELECT auth.proc_publish_iam_state();
