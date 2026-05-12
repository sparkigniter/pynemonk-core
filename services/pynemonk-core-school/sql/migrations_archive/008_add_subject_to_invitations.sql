-- ─────────────────────────────────────────────────────────────────────────────
-- 008_add_subject_to_invitations.sql
-- Enables granular exam invitations by adding subject tracking.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add subject_id to exam_invitation
ALTER TABLE school.exam_invitation 
ADD COLUMN IF NOT EXISTS subject_id int REFERENCES school.subject(id);

-- 2. Add an index for subject-based lookups
CREATE INDEX IF NOT EXISTS idx_exam_invitation_subject ON school.exam_invitation (subject_id) WHERE is_deleted = FALSE;

-- 3. Update commentary
COMMENT ON COLUMN school.exam_invitation.subject_id IS 'Specific subject for which this grade/classroom is invited. If NULL, they are invited for all papers in the exam.';
