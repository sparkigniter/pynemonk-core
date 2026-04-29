-- ─────────────────────────────────────────────────────────────────────────────
-- 007_add_exam_supervisor.sql
-- Adds supervisor tracking to exam papers and ensures unique constraints for upserts.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add supervisor_id to exam_paper
ALTER TABLE school.exam_paper 
ADD COLUMN IF NOT EXISTS supervisor_id int REFERENCES school.staff(id);

-- 2. Add an index for faster supervisor lookups
CREATE INDEX IF NOT EXISTS idx_exam_paper_supervisor ON school.exam_paper (supervisor_id) WHERE is_deleted = FALSE;

-- 3. Ensure we have a clear updated_at timestamp for sync tracking
ALTER TABLE school.exam_paper 
ALTER COLUMN updated_at SET DEFAULT NOW();

-- 4. Commentary
COMMENT ON COLUMN school.exam_paper.supervisor_id IS 'The staff member assigned to proctor/supervise this specific exam paper.';
