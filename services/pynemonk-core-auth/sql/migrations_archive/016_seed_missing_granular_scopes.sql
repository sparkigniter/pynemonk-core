-- Migration: 016_seed_missing_granular_scopes
-- Description: Adds missing scopes for Exams, Assignments, and Reports to the global registry.

INSERT INTO auth.scope (value, description)
VALUES 
    ('exam:read', 'View examination schedules and details'),
    ('exam:write', 'Create, update, and publish examinations'),
    ('assignment:read', 'View student assignments and submissions'),
    ('assignment:write', 'Create, update, and publish student assignments'),
    ('report:write', 'Configure and manage report templates'),
    ('student.attendance:read', 'View student attendance history'),
    ('student.attendance:write', 'Record or update student attendance'),
    ('mark:read', 'View student marks and evaluation reports'),
    ('mark:write', 'Enter or update student marks for examinations'),
    ('staff.directory:read', 'View basic directory of colleagues (Name, Photo, Specialization)'),
    ('student.directory:read', 'View basic directory of all students (Name, Photo, Class)'),
    ('teacher_note:read', 'View teacher diary notes and lesson plans'),
    ('teacher_note:write', 'Create or update teacher diary notes and lesson plans')
ON CONFLICT (value) DO NOTHING;

-- Update role templates with these new specific scopes where appropriate
-- For example, ensure Teachers have exam:read
UPDATE auth.role_template 
SET data_scope = data_scope || '["exam:read", "assignment:read", "assignment:write", "student.attendance:read", "student.attendance:write", "timetable:read", "mark:read", "mark:write", "staff.directory:read", "student.directory:read", "teacher_note:read", "teacher_note:write"]'::jsonb
WHERE slug = 'teacher';

UPDATE auth.role_template 
SET data_scope = data_scope || '["exam:read", "exam:write", "assignment:read", "assignment:write", "report:write", "teacher_note:read", "mark:read", "mark:write"]'::jsonb
WHERE slug IN ('principal', 'school_admin');

-- Grant these new scopes to the frontend and mobile clients
-- Without this, the scopes will be stripped during JWT generation even if assigned to roles
INSERT INTO auth.client_scope (client_id, scope_id)
SELECT c.id, s.id 
FROM auth.client c, auth.scope s
WHERE c.client_id IN ('frontend_client', 'mobile_app')
AND s.value IN (
    'staff.directory:read', 
    'student.directory:read', 
    'teacher_note:read', 
    'teacher_note:write',
    'exam:read',
    'exam:write',
    'assignment:read',
    'assignment:write',
    'mark:read',
    'mark:write'
)
ON CONFLICT DO NOTHING;
