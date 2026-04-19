import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class GuardianHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async createGuardian(data: {
        tenant_id: number;
        user_id: number;
        first_name: string;
        last_name?: string;
        phone?: string;
        email: string;
        address?: string;
        occupation?: string;
    }): Promise<any> {
        const res = await this.db.query(
            `INSERT INTO school.guardian
                (tenant_id, user_id, first_name, last_name, phone, email, address, occupation)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, first_name, last_name`,
            [
                data.tenant_id,
                data.user_id,
                data.first_name,
                data.last_name ?? null,
                data.phone ?? null,
                data.email,
                data.address ?? null,
                data.occupation ?? null
            ]
        );
        return res.rows[0];
    }

    public async linkStudent(tenantId: number, studentId: number, guardianId: number, relation: string): Promise<void> {
        await this.db.query(
            `INSERT INTO school.student_guardian (tenant_id, student_id, guardian_id, relation)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (student_id, guardian_id) DO UPDATE SET relation = $4, is_deleted = FALSE`,
            [tenantId, studentId, guardianId, relation]
        );
    }

    public async getStudentGuardians(studentId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT g.*, sg.relation, sg.is_emergency
             FROM school.guardian g
             JOIN school.student_guardian sg ON g.id = sg.guardian_id
             WHERE sg.student_id = $1 AND sg.is_deleted = FALSE`,
            [studentId]
        );
        return res.rows;
    }
}
