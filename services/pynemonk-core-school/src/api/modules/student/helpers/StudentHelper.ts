import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class StudentHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async createStudent(
        data: {
            tenant_id: number;
            user_id: number;
            admission_no: string;
            first_name: string;
            last_name?: string;
            gender?: string;
            date_of_birth?: string;
            blood_group?: string;
            nationality?: string;
            religion?: string;
            phone?: string;
            address?: string;
            avatar_url?: string;
        },
        db: Pool | any = this.db,
    ): Promise<any> {
        const res = await db.query(
            `INSERT INTO school.student
                (tenant_id, user_id, admission_no, first_name, last_name, gender, date_of_birth,
                 blood_group, nationality, religion, phone, address, avatar_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
             RETURNING id, admission_no, first_name, last_name, created_at`,
            [
                data.tenant_id,
                data.user_id,
                data.admission_no,
                data.first_name,
                data.last_name ?? null,
                data.gender ?? null,
                data.date_of_birth ?? null,
                data.blood_group ?? null,
                data.nationality ?? null,
                data.religion ?? null,
                data.phone ?? null,
                data.address ?? null,
                data.avatar_url ?? null,
            ],
        );
        return res.rows[0];
    }

    public async getStudentById(tenantId: number, studentId: number): Promise<any> {
        const res = await this.db.query(
            `SELECT s.*, 
                    se.roll_number, 
                    c.name as classroom_name, 
                    g.id as current_grade_id, 
                    g.name as current_grade_name, 
                    g.sequence_order as current_grade_sequence
             FROM school.student s
             LEFT JOIN school.student_enrollment se ON s.id = se.student_id AND se.status = 'active' AND se.is_deleted = FALSE
             LEFT JOIN school.classroom c ON se.classroom_id = c.id
             LEFT JOIN school.grade g ON c.grade_id = g.id
             WHERE s.id = $1 AND s.tenant_id = $2 AND s.is_deleted = false`,
            [studentId, tenantId],
        );
        return res.rows[0];
    }

    public async listStudents(
        tenantId: number,
        filters: {
            page?: number;
            limit?: number;
            search?: string;
            classroom_id?: number;
            academic_year_id?: number;
        } = {},
        scope: any = { accessLevel: "FULL" },
    ): Promise<any> {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.max(1, Math.min(100, filters.limit || 10));
        const offset = (page - 1) * limit;

        let query = `
            SELECT DISTINCT s.*, COUNT(*) OVER() as total_count
            FROM school.student s
        `;

        const conditions = [`s.tenant_id = $1`, `s.is_deleted = false`];
        const params: any[] = [tenantId];
        let paramIndex = 2;

        // Apply Scope and Academic Year Filters
        if (filters.academic_year_id || filters.classroom_id || scope.accessLevel === "ASSIGNED") {
            query += ` JOIN school.student_enrollment se ON s.id = se.student_id AND se.is_deleted = FALSE`;
            
            if (filters.academic_year_id) {
                conditions.push(`se.academic_year_id = $${paramIndex}`);
                params.push(filters.academic_year_id);
                paramIndex++;
            }
            
            if (filters.classroom_id) {
                conditions.push(`se.classroom_id = $${paramIndex}`);
                params.push(filters.classroom_id);
                paramIndex++;
            }
        }

        if (scope.accessLevel === "ASSIGNED") {
            conditions.push(`s.id = $${paramIndex}`);
            params.push(scope.studentId);
            paramIndex++;
        }

        // Apply Search
        if (filters.search) {
            conditions.push(
                `(s.first_name ILIKE $${paramIndex} OR s.last_name ILIKE $${paramIndex} OR s.admission_no ILIKE $${paramIndex})`,
            );
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        query += ` WHERE ` + conditions.join(" AND ");
        query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const res = await this.db.query(query, params);

        const totalCount = res.rows.length > 0 ? parseInt(res.rows[0].total_count) : 0;
        const students = res.rows.map((row: any) => {
            const { total_count, ...data } = row;
            return data;
        });

        return {
            data: students,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit),
            },
        };
    }

    public async updateStudent(tenantId: number, studentId: number, data: any): Promise<any> {
        const keys = Object.keys(data).filter((k) => k !== "id" && k !== "tenant_id");
        if (keys.length === 0) return null;

        const setClause = keys.map((k, i) => `${k} = $${i + 3}`).join(", ");
        const values = keys.map((k) => data[k]);

        const res = await this.db.query(
            `UPDATE school.student
             SET ${setClause}, updated_at = NOW()
             WHERE id = $1 AND tenant_id = $2 AND is_deleted = false
             RETURNING *`,
            [studentId, tenantId, ...values],
        );
        return res.rows[0];
    }
}
