import { injectable, inject } from "tsyringe";
import { Grade } from "../helpers/GradeHelper.js";
import AcademicYearHelper from "../../academics/helpers/AcademicYearHelper.js";

@injectable()
export class GradeService {
    constructor(
        @inject("DB") private db: any,
        private academicYearHelper: AcademicYearHelper
    ) {}

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

    async getGrades(tenantId: number, filters: any = {}) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.max(1, Math.min(100, filters.limit || 100)); // Default to 100 for grades as they are usually few
        const offset = (page - 1) * limit;

        let academicYearId = filters.academic_year_id;
        if (!academicYearId) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            academicYearId = currentYear?.id;
        }

        let query = `
            SELECT 
                g.*,
                COUNT(*) OVER() as total_count,
                (
                    SELECT COUNT(se.id) 
                    FROM school.classroom c 
                    JOIN school.student_enrollment se ON se.classroom_id = c.id 
                    WHERE c.grade_id = g.id 
                      AND se.is_deleted = FALSE 
                      AND se.status = 'active'
                      AND se.academic_year_id = $2
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
                      AND c.academic_year_id = $2
                ) as classroom_count
            FROM school.grade g
            WHERE g.tenant_id = $1 AND g.is_deleted = FALSE 
        `;

        const params: any[] = [tenantId, academicYearId];
        let paramIndex = 3;

        if (filters.gradeIds) {
            query += ` AND g.id = ANY($${paramIndex})`;
            params.push(filters.gradeIds);
            paramIndex++;
        }

        if (filters.search) {
            query += ` AND (g.name ILIKE $${paramIndex} OR g.slug ILIKE $${paramIndex})`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        query += ` ORDER BY g.sequence_order ASC, g.name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await this.db.query(query, params);
        
        const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
        const grades = result.rows.map((row: any) => {
            const { total_count, ...data } = row;
            return data;
        });

        return {
            data: grades,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit),
            },
        };
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
