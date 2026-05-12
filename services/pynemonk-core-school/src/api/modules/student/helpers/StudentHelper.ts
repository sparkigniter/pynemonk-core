import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class StudentHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async createStudent(
        data: any,
        db: Pool | any = this.db,
    ): Promise<any> {
        const res = await db.query(
            `INSERT INTO school.student
                (tenant_id, user_id, admission_no, first_name, last_name, gender, date_of_birth,
                 blood_group, nationality, religion, mother_tongue, id_number, previous_school, 
                 medical_notes, phone, address, avatar_url, admission_date)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
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
                data.mother_tongue ?? null,
                data.id_number ?? null,
                data.previous_school ?? null,
                data.medical_notes ?? null,
                data.phone ?? null,
                data.address ?? null,
                data.avatar_url ?? null,
                data.admission_date ?? new Date(),
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
                    g.sequence_order as current_grade_sequence,
                    (SELECT jsonb_object_agg(system_slug, external_id) 
                     FROM school.external_identity 
                     WHERE tenant_id = s.tenant_id AND entity_type = 'student' AND entity_id = s.id
                    ) as external_ids
             FROM school.student s
             LEFT JOIN school.student_enrollment se ON s.id = se.student_id AND se.status = 'active' AND se.is_deleted = FALSE
             LEFT JOIN school.classroom c ON se.classroom_id = c.id
             LEFT JOIN school.grade g ON c.grade_id = g.id
             WHERE s.id = $1 AND s.tenant_id = $2 AND s.is_deleted = false`,
            [studentId, tenantId],
        );
        return res.rows[0];
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

    // ─── Logs & History ──────────────────────────────────────────────────────

    public async createLog(
        data: { tenant_id: number; student_id: number; event_type: string; description: string; metadata?: any },
        db: Pool | any = this.db
    ): Promise<void> {
        await db.query(
            `INSERT INTO school.student_log (tenant_id, student_id, event_type, description, metadata)
             VALUES ($1, $2, $3, $4, $5)`,
            [data.tenant_id, data.student_id, data.event_type, data.description, data.metadata ? JSON.stringify(data.metadata) : null]
        );
    }

    public async getLogs(tenantId: number, studentId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT * FROM school.student_log 
             WHERE tenant_id = $1 AND student_id = $2 
             ORDER BY created_at DESC`,
            [tenantId, studentId]
        );
        return res.rows;
    }

    // ─── Documents ───────────────────────────────────────────────────────────

    public async addDocument(data: { tenant_id: number; student_id: number; document_type: string; file_name: string; file_url: string }): Promise<any> {
        const res = await this.db.query(
            `INSERT INTO school.student_document (tenant_id, student_id, document_type, file_name, file_url)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [data.tenant_id, data.student_id, data.document_type, data.file_name, data.file_url]
        );
        return res.rows[0];
    }

    public async getDocuments(tenantId: number, studentId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT * FROM school.student_document 
             WHERE tenant_id = $1 AND student_id = $2 AND is_deleted = FALSE
             ORDER BY created_at DESC`,
            [tenantId, studentId]
        );
        return res.rows;
    }

    // ─── Search & List (preserved) ───────────────────────────────────────────


    public async listStudents(
        tenantId: number,
        filters: any = {}
    ): Promise<any> {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.max(1, Math.min(100, filters.limit || 10));
        const offset = (page - 1) * limit;

        const conditions = [`s.tenant_id = $1`, `s.is_deleted = false`];
        const params: any[] = [tenantId];
        let paramIndex = 2;

        // ── Enrollment JOIN conditions (built dynamically) ────────────────────
        // These MUST go into the JOIN, not the WHERE, so that students without
        // an enrollment row (e.g. admitted but not yet assigned to a classroom)
        // are still visible in the listing.
        const enrollJoinConditions = [
            `se.student_id = s.id`,
            `se.is_deleted = FALSE`,
            `se.status = 'active'`,
        ];

        if (filters.academic_year_id) {
            enrollJoinConditions.push(`se.academic_year_id = $${paramIndex}`);
            params.push(filters.academic_year_id);
            paramIndex++;
        }

        if (filters.classroom_id) {
            if (filters.classroom_id === 'none' || filters.classroom_id === 0) {
                conditions.push(`se.classroom_id IS NULL`);
            } else {
                enrollJoinConditions.push(`se.classroom_id = $${paramIndex}`);
                params.push(filters.classroom_id);
                paramIndex++;
            }
        }

        if (filters.grade_id) {
            conditions.push(`c.grade_id = $${paramIndex}`);
            params.push(filters.grade_id);
            paramIndex++;
        }

        if (filters.search) {
            conditions.push(
                `(s.first_name ILIKE $${paramIndex} OR s.last_name ILIKE $${paramIndex} OR s.admission_no ILIKE $${paramIndex})`,
            );
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        if (filters.gender) {
            conditions.push(`s.gender = $${paramIndex}`);
            params.push(filters.gender);
            paramIndex++;
        }

        if (filters.blood_group) {
            conditions.push(`s.blood_group = $${paramIndex}`);
            params.push(filters.blood_group);
            paramIndex++;
        }

        if (filters.religion) {
            conditions.push(`s.religion = $${paramIndex}`);
            params.push(filters.religion);
            paramIndex++;
        }

        if (filters.nationality) {
            conditions.push(`s.nationality = $${paramIndex}`);
            params.push(filters.nationality);
            paramIndex++;
        }

        if (filters.ids) {
            conditions.push(`s.id = ANY($${paramIndex})`);
            params.push(filters.ids);
            paramIndex++;
        }

        // Optionally surface unenrolled students only
        if (filters.unenrolled === true || filters.unenrolled === 'true') {
            conditions.push(`se.id IS NULL`);
        }

        const whereClause = ` WHERE ` + conditions.join(" AND ");
        const enrollJoinOn = enrollJoinConditions.join(" AND ");

        const baseJoin = `
            FROM school.student s
            LEFT JOIN school.student_enrollment se ON ${enrollJoinOn}
            LEFT JOIN school.classroom c ON se.classroom_id = c.id
            LEFT JOIN accounting.v_student_financial_status vfs ON s.id = vfs.student_id
        `;

        // 1. Get accurate total count
        const countQuery = `SELECT COUNT(DISTINCT s.id) as total ${baseJoin} ${whereClause}`;
        const countRes = await this.db.query(countQuery, params);
        const totalCount = parseInt(countRes.rows[0].total);

        // 2. Get paginated data
        const dataQuery = `
            SELECT DISTINCT ON (s.created_at, s.id) s.*, 
                   se.academic_year_id as enrollment_year_id,
                   c.name as classroom_name, c.section as classroom_section,
                   COALESCE(vfs.financial_status, 'unpaid') as fee_status,
                   COALESCE(vfs.outstanding_balance, 0) as outstanding_balance
            ${baseJoin}
            ${whereClause}
            ORDER BY s.created_at DESC, s.id ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const dataParams = [...params, limit, offset];
        const res = await this.db.query(dataQuery, dataParams);

        return {
            data: res.rows,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit),
            },
        };
    }

    public async findByUserId(tenantId: number, userId: number) {
        const res = await this.db.query(
            `SELECT s.*, 
                    se.roll_number, 
                    se.classroom_id,
                    c.name as classroom_name, 
                    g.name as current_grade_name
             FROM school.student s
             LEFT JOIN school.student_enrollment se ON s.id = se.student_id AND se.status = 'active' AND se.is_deleted = FALSE
             LEFT JOIN school.classroom c ON se.classroom_id = c.id
             LEFT JOIN school.grade g ON c.grade_id = g.id
             WHERE s.user_id = $1 AND s.tenant_id = $2 AND s.is_deleted = false`,
            [userId, tenantId],
        );
        return res.rows[0];
    }
}
