import { injectable, inject } from "tsyringe";
import { Grade } from "../helpers/GradeHelper.js";

@injectable()
export class GradeService {
    constructor(@inject("DB") private db: any) {}

    async createGrade(tenantId: number, data: Partial<Grade>) {
        const query = `
            INSERT INTO school.grade (tenant_id, name, slug, sequence_order)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await this.db.query(query, [
            tenantId,
            data.name,
            data.slug,
            data.sequence_order || 0,
        ]);
        return result.rows[0];
    }

    async getGrades(tenantId: number) {
        const query = `
            SELECT 
                g.*,
                (
                    SELECT COUNT(se.id) 
                    FROM school.classroom c 
                    JOIN school.student_enrollment se ON se.classroom_id = c.id 
                    WHERE c.grade_id = g.id 
                      AND se.is_deleted = FALSE 
                      AND se.status = 'active'
                ) as student_count,
                (
                    SELECT COUNT(s.id) 
                    FROM school.subject s 
                    WHERE s.grade_id = g.id 
                      AND s.is_deleted = FALSE
                ) as subject_count,
                (
                    SELECT COUNT(c.id) 
                    FROM school.classroom c 
                    WHERE c.grade_id = g.id 
                      AND c.is_deleted = FALSE
                ) as classroom_count
            FROM school.grade g
            WHERE g.tenant_id = $1 AND g.is_deleted = FALSE 
            ORDER BY g.sequence_order ASC, g.name ASC
        `;
        const result = await this.db.query(query, [tenantId]);
        return result.rows;
    }

    async updateGrade(tenantId: number, id: number, data: Partial<Grade>) {
        const query = `
            UPDATE school.grade
            SET name = COALESCE($1, name),
                slug = COALESCE($2, slug),
                sequence_order = COALESCE($3, sequence_order),
                updated_at = NOW()
            WHERE id = $4 AND tenant_id = $5
            RETURNING *
        `;
        const result = await this.db.query(query, [
            data.name,
            data.slug,
            data.sequence_order,
            id,
            tenantId,
        ]);
        return result.rows[0];
    }

    async deleteGrade(tenantId: number, id: number) {
        const query = `
            UPDATE school.grade
            SET is_deleted = TRUE, updated_at = NOW()
            WHERE id = $1 AND tenant_id = $2
        `;
        await this.db.query(query, [id, tenantId]);
        return { success: true };
    }
}
