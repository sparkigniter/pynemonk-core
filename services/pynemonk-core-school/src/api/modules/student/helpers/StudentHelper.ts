import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class StudentHelper {
    constructor(@inject("DB") private db: Pool) { }

    public async createStudent(data: {
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
    }, db: Pool | any = this.db): Promise<any> {
        const res = await db.query(
            `INSERT INTO school.student
                (tenant_id, user_id, admission_no, first_name, last_name, gender, date_of_birth,
                 blood_group, nationality, religion, phone, address)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
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
                data.address ?? null
            ]
        );
        return res.rows[0];
    }

    public async getStudentById(tenantId: number, studentId: number): Promise<any> {
        const res = await this.db.query(
            `SELECT * FROM school.student
             WHERE id = $1 AND tenant_id = $2 AND is_deleted = false`,
            [studentId, tenantId]
        );
        return res.rows[0];
    }

    public async listStudents(tenantId: number, scope: any, limit: number = 50, offset: number = 0): Promise<any[]> {
        let query = `
            SELECT DISTINCT s.id, s.admission_no, s.first_name, s.last_name, s.gender, s.date_of_birth, s.phone, s.created_at
            FROM school.student s
        `;

        const conditions = [`s.tenant_id = $1`, `s.is_deleted = false`];
        const params: any[] = [tenantId];

        // Apply Scope Filters
        if (scope.accessLevel === "ASSIGNED") {
            // Join with enrollment to filter by classes assigned to this teacher
            query += ` JOIN school.student_enrollment se ON s.id = se.student_id AND se.is_deleted = FALSE`;
            conditions.push(`se.classroom_id = ANY($${params.length + 1}::int[])`);
            params.push(scope.classroomIds);
        } else if (scope.accessLevel === "SELF") {
            conditions.push(`s.id = $${params.length + 1}`);
            params.push(scope.studentId);
        }

        query += ` WHERE ` + conditions.join(' AND ');
        query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const res = await this.db.query(query, params);
        return res.rows;
    }

    public async updateStudent(tenantId: number, studentId: number, data: any): Promise<any> {
        const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'tenant_id');
        if (keys.length === 0) return null;

        const setClause = keys.map((k, i) => `${k} = $${i + 3}`).join(', ');
        const values = keys.map(k => data[k]);

        const res = await this.db.query(
            `UPDATE school.student
             SET ${setClause}, updated_at = NOW()
             WHERE id = $1 AND tenant_id = $2 AND is_deleted = false
             RETURNING *`,
            [studentId, tenantId, ...values]
        );
        return res.rows[0];
    }
}
