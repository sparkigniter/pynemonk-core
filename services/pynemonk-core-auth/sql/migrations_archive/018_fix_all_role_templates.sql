-- Migration: 018_fix_all_role_templates.sql
-- Description: Comprehensive update to role templates based on high-standard business requirements.

-- 1. Ensure all scopes exist (safety check)
INSERT INTO auth.scope (value, description)
VALUES 
    ('exam:read', 'View examination schedules and details'),
    ('exam:write', 'Create, update, and publish examinations'),
    ('mark:read', 'View student marks and evaluation reports'),
    ('mark:write', 'Enter or update student marks for examinations'),
    ('assignment:read', 'View student assignments and submissions'),
    ('assignment:write', 'Create, update, and publish student assignments'),
    ('teacher_note:read', 'View teacher diary notes and lesson plans'),
    ('teacher_note:write', 'Create or update teacher diary notes and lesson plans'),
    ('staff.directory:read', 'View basic directory of colleagues'),
    ('student.directory:read', 'View basic directory of all students'),
    ('report.class:read', 'View class-specific academic reports'),
    ('report.financial:read', 'View school financial reports')
ON CONFLICT (value) DO NOTHING;

-- 2. Define business standard scopes for each role
-- We use a CTE to define the mapping and then update auth.role_template

WITH standard_scopes AS (
    SELECT 'principal' as slug, '["student:read", "student:write", "student.academic:read", "student.academic:write", "student.attendance:read", "student.attendance:write", "student.disciplinary:read", "student.disciplinary:write", "staff:read", "staff.academic:read", "class:read", "class:write", "report:read", "report:export", "fee.summary:read", "exam:read", "exam:write", "mark:read", "mark:write", "assignment:read", "assignment:write", "teacher_note:read", "staff.directory:read", "student.directory:read", "settings:read"]'::jsonb as scopes
    UNION ALL
    SELECT 'school_admin' as slug, '["student:read", "student:write", "student.attendance:read", "student.attendance:write", "staff:read", "staff:write", "class:read", "class:write", "timetable:read", "timetable:write", "user:invite", "user:deactivate", "announcement:write", "settings:read", "settings:write", "report:read", "report:export", "exam:read", "assignment:read", "student.directory:read", "staff.directory:read"]'::jsonb as scopes
    UNION ALL
    SELECT 'teacher' as slug, '["student:read", "student.academic:read", "student.academic:write", "student.attendance:read", "student.attendance:write", "class:read", "assignment:read", "assignment:write", "exam:read", "mark:read", "mark:write", "report.class:read", "teacher_note:read", "teacher_note:write", "staff.directory:read", "student.directory:read", "timetable:read", "settings:read"]'::jsonb as scopes
    UNION ALL
    SELECT 'accountant' as slug, '["fee:read", "fee:write", "fee.collection:write", "fee.summary:read", "student:read", "report.financial:read", "report.financial:export", "staff.payroll:read", "settings:read"]'::jsonb as scopes
    UNION ALL
    SELECT 'vice_principal' as slug, '["student:read", "student.academic:read", "student.academic:write", "student.attendance:read", "student.attendance:write", "student.disciplinary:read", "staff:read", "class:read", "class:write", "report:read", "exam:read", "mark:read", "assignment:read", "settings:read"]'::jsonb as scopes
    UNION ALL
    SELECT 'parent' as slug, '["child.academic:read", "child.attendance:read", "child.timetable:read", "child.fee:read", "child.disciplinary:read", "announcement:read", "teacher.contact:read", "settings:read"]'::jsonb as scopes
    UNION ALL
    SELECT 'student' as slug, '["self.academic:read", "self.attendance:read", "self.timetable:read", "self.assignment:read", "self.fee:read", "announcement:read", "settings:read"]'::jsonb as scopes
)
UPDATE auth.role_template rt
SET data_scope = s.scopes
FROM standard_scopes s
WHERE rt.slug = s.slug AND rt.client_id IS NULL;
