import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class PartnerHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async list(tenantId: number, type?: string, search?: string): Promise<any[]> {
        // Build a unified query that avoids duplicates by prioritizing existing partners
        let query = `
            WITH all_sources AS (
                -- 1. Formal accounting partners (The primary source of truth)
                -- These might be linked to students/guardians via external_ref_id
                SELECT 
                    id, tenant_id, name, email, phone, type, 
                    external_ref_type, external_ref_id,
                    TRUE as is_formal
                FROM accounting.partner 
                WHERE tenant_id = $1 AND is_deleted = FALSE

                UNION ALL

                -- 2. Students who DON'T have a formal partner record yet
                SELECT 
                    s.id, s.tenant_id, s.first_name || ' ' || s.last_name as name, u.email, s.phone, 
                    'customer' as type, 'student' as external_ref_type, s.id as external_ref_id,
                    FALSE as is_formal
                FROM school.student s
                JOIN auth.user u ON s.user_id = u.id
                WHERE s.tenant_id = $1 AND s.is_deleted = FALSE
                AND NOT EXISTS (
                    SELECT 1 FROM accounting.partner p 
                    WHERE p.tenant_id = $1 AND p.external_ref_type = 'student' AND p.external_ref_id = s.id
                )

                UNION ALL

                -- 3. Guardians who DON'T have a formal partner record yet
                SELECT 
                    g.id, g.tenant_id, g.first_name || ' ' || g.last_name as name, g.email, g.phone, 
                    'customer' as type, 'guardian' as external_ref_type, g.id as external_ref_id,
                    FALSE as is_formal
                FROM school.guardian g
                WHERE g.tenant_id = $1 AND g.is_deleted = FALSE
                AND NOT EXISTS (
                    SELECT 1 FROM accounting.partner p 
                    WHERE p.tenant_id = $1 AND p.external_ref_type = 'guardian' AND p.external_ref_id = g.id
                )
            )
            SELECT * FROM all_sources WHERE 1=1
        `;
        const params: any[] = [tenantId];

        if (type) {
            params.push(type);
            query += ` AND type = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND name ILIKE $${params.length}`;
        }

        query += ` ORDER BY is_formal DESC, name LIMIT 100`;
        const res = await this.db.query(query, params);
        return res.rows;
    }

    /**
     * Ensures an accounting partner exists for a student.
     * This is called during fee generation or admission.
     */
    public async getOrCreateFromStudent(tenantId: number, studentId: number, db: Pool | any = this.db): Promise<any> {
        // 1. Check if partner already exists
        const existing = await db.query(
            `SELECT * FROM accounting.partner 
             WHERE tenant_id = $1 AND external_ref_type = 'student' AND external_ref_id = $2`,
            [tenantId, studentId]
        );

        if (existing.rows.length > 0) return existing.rows[0];

        // 2. Fetch student details to create partner
        const studentRes = await db.query(
            `SELECT first_name, last_name, email, phone FROM school.student WHERE id = $1`,
            [studentId]
        );
        if (studentRes.rows.length === 0) throw new Error("Student not found");
        const student = studentRes.rows[0];

        // 3. Create partner
        const name = `${student.first_name} ${student.last_name}`;
        const res = await db.query(
            `INSERT INTO accounting.partner 
                (tenant_id, name, email, phone, type, external_ref_type, external_ref_id)
             VALUES ($1, $2, $3, $4, 'customer', 'student', $5)
             RETURNING *`,
            [tenantId, name, student.email, student.phone, studentId]
        );

        return res.rows[0];
    }

    public async create(tenantId: number, data: any): Promise<any> {
        const res = await this.db.query(
            `INSERT INTO accounting.partner 
                (tenant_id, name, email, phone, type, external_ref_type, external_ref_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                tenantId, data.name, data.email, data.phone, 
                data.type || 'customer', data.external_ref_type, data.external_ref_id
            ]
        );
        return res.rows[0];
    }
}
