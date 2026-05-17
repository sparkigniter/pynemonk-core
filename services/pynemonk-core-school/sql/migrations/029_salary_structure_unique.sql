-- Deduplicate if any duplicate structures exist
DELETE FROM school.salary_structure a USING school.salary_structure b
WHERE a.id < b.id AND a.staff_id = b.staff_id AND a.tenant_id = b.tenant_id;

-- Add unique constraint
ALTER TABLE school.salary_structure ADD CONSTRAINT salary_structure_staff_tenant_unique UNIQUE (staff_id, tenant_id);
