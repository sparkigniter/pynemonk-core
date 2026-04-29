import { injectable, inject } from "tsyringe";
import BaseModel from "../../../core/models/BaseModel.js";

@injectable()
export default class StaffHelper extends BaseModel {
    constructor(@inject("DB") private db: any) {
        super();
    }

    public async findAll(
        tenantId: number,
        filters: {
            page?: number;
            limit?: number;
            search?: string;
            status?: string;
        } = {},
    ) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.max(1, Math.min(100, filters.limit || 10));
        const offset = (page - 1) * limit;

        let query = `
            WITH assignments AS (
                SELECT 
                    ta.staff_id,
                    JSON_AGG(JSON_BUILD_OBJECT(
                        'classroom_id', ta.classroom_id,
                        'classroom_name', c.name,
                        'subject_id', ta.subject_id,
                        'subject_name', sub.name
                    )) as subjects
                FROM school.teacher_assignment ta
                JOIN school.classroom c ON ta.classroom_id = c.id
                JOIN school.subject sub ON ta.subject_id = sub.id
                WHERE ta.tenant_id = $1 AND ta.is_deleted = FALSE
                GROUP BY ta.staff_id
            ),
            class_teachers AS (
                SELECT DISTINCT class_teacher_id as staff_id
                FROM school.classroom
                WHERE tenant_id = $1 AND is_deleted = FALSE AND class_teacher_id IS NOT NULL
            )
            SELECT 
                s.*, 
                COUNT(*) OVER() as total_count,
                COALESCE(a.subjects, '[]') as assignments,
                (ct.staff_id IS NOT NULL) as is_class_teacher
            FROM school.staff s
            LEFT JOIN assignments a ON s.id = a.staff_id
            LEFT JOIN class_teachers ct ON s.id = ct.staff_id
            WHERE s.tenant_id = $1 AND s.is_deleted = FALSE
        `;
        const values: any[] = [tenantId];
        let paramIndex = 2;

        if (filters.search) {
            query += ` AND (s.first_name ILIKE $${paramIndex} OR s.last_name ILIKE $${paramIndex} OR s.employee_code ILIKE $${paramIndex})`;
            values.push(`%${filters.search}%`);
            paramIndex++;
        }

        if (filters.status) {
            query += ` AND s.status = $${paramIndex}`;
            values.push(filters.status);
            paramIndex++;
        }

        query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        values.push(limit, offset);

        const result = await this.db.query(query, values);

        const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
        const staff = result.rows.map((row: any) => {
            const { total_count, ...data } = row;
            return data;
        });

        return {
            data: staff,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit),
            },
        };
    }

    public async findById(tenantId: number, id: number) {
        const query = `
            SELECT s.*
            FROM school.staff s
            WHERE s.tenant_id = $1 AND s.id = $2 AND s.is_deleted = FALSE
        `;
        const result = await this.db.query(query, [tenantId, id]);
        return result.rows[0];
    }

    private nullIfEmpty(val: any) {
        if (val === "" || val === undefined) return null;
        return val;
    }

    public async create(data: any, db: any = this.db) {
        const query = `
            INSERT INTO school.staff (
                tenant_id, user_id, employee_code, first_name, last_name, 
                gender, date_of_birth, phone, address, qualification, 
                specialization, joining_date, designation, avatar_url,
                blood_group, religion, nationality, emergency_contact_name,
                emergency_contact_phone, marital_status, experience_years,
                status, aadhaar_number, pan_number, bank_account_no,
                bank_name, ifsc_code
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
            RETURNING *
        `;
        const values = [
            this.nullIfEmpty(data.tenant_id),
            this.nullIfEmpty(data.user_id),
            this.nullIfEmpty(data.employee_code),
            this.nullIfEmpty(data.first_name),
            this.nullIfEmpty(data.last_name),
            this.nullIfEmpty(data.gender),
            this.nullIfEmpty(data.date_of_birth),
            this.nullIfEmpty(data.phone),
            this.nullIfEmpty(data.address),
            this.nullIfEmpty(data.qualification),
            this.nullIfEmpty(data.specialization),
            this.nullIfEmpty(data.joining_date),
            this.nullIfEmpty(data.designation),
            this.nullIfEmpty(data.avatar_url),
            this.nullIfEmpty(data.blood_group),
            this.nullIfEmpty(data.religion),
            this.nullIfEmpty(data.nationality),
            this.nullIfEmpty(data.emergency_contact_name),
            this.nullIfEmpty(data.emergency_contact_phone),
            this.nullIfEmpty(data.marital_status),
            this.nullIfEmpty(data.experience_years) || 0,
            this.nullIfEmpty(data.status) || "active",
            this.nullIfEmpty(data.aadhaar_number),
            this.nullIfEmpty(data.pan_number),
            this.nullIfEmpty(data.bank_account_no),
            this.nullIfEmpty(data.bank_name),
            this.nullIfEmpty(data.ifsc_code),
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    public async update(tenantId: number, id: number, data: any) {
        const query = `
            UPDATE school.staff SET
                employee_code = COALESCE($3, employee_code),
                first_name = COALESCE($4, first_name),
                last_name = COALESCE($5, last_name),
                gender = COALESCE($6, gender),
                date_of_birth = COALESCE($7, date_of_birth),
                phone = COALESCE($8, phone),
                address = COALESCE($9, address),
                qualification = COALESCE($10, qualification),
                specialization = COALESCE($11, specialization),
                joining_date = COALESCE($12, joining_date),
                designation = COALESCE($13, designation),
                avatar_url = COALESCE($14, avatar_url),
                blood_group = COALESCE($15, blood_group),
                religion = COALESCE($16, religion),
                nationality = COALESCE($17, nationality),
                emergency_contact_name = COALESCE($18, emergency_contact_name),
                emergency_contact_phone = COALESCE($19, emergency_contact_phone),
                marital_status = COALESCE($20, marital_status),
                experience_years = COALESCE($21, experience_years),
                status = COALESCE($22, status),
                aadhaar_number = COALESCE($23, aadhaar_number),
                pan_number = COALESCE($24, pan_number),
                bank_account_no = COALESCE($25, bank_account_no),
                bank_name = COALESCE($26, bank_name),
                ifsc_code = COALESCE($27, ifsc_code),
                updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2 AND is_deleted = FALSE
            RETURNING *
        `;
        const values = [
            tenantId,
            id,
            this.nullIfEmpty(data.employee_code),
            this.nullIfEmpty(data.first_name),
            this.nullIfEmpty(data.last_name),
            this.nullIfEmpty(data.gender),
            this.nullIfEmpty(data.date_of_birth),
            this.nullIfEmpty(data.phone),
            this.nullIfEmpty(data.address),
            this.nullIfEmpty(data.qualification),
            this.nullIfEmpty(data.specialization),
            this.nullIfEmpty(data.joining_date),
            this.nullIfEmpty(data.designation),
            this.nullIfEmpty(data.avatar_url),
            this.nullIfEmpty(data.blood_group),
            this.nullIfEmpty(data.religion),
            this.nullIfEmpty(data.nationality),
            this.nullIfEmpty(data.emergency_contact_name),
            this.nullIfEmpty(data.emergency_contact_phone),
            this.nullIfEmpty(data.marital_status),
            this.nullIfEmpty(data.experience_years),
            this.nullIfEmpty(data.status),
            this.nullIfEmpty(data.aadhaar_number),
            this.nullIfEmpty(data.pan_number),
            this.nullIfEmpty(data.bank_account_no),
            this.nullIfEmpty(data.bank_name),
            this.nullIfEmpty(data.ifsc_code),
        ];
        const result = await this.db.query(query, values);
        return result.rows[0];
    }

    public async delete(tenantId: number, id: number) {
        const query = `
            UPDATE school.staff SET is_deleted = TRUE, updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
            RETURNING id
        `;
        const result = await this.db.query(query, [tenantId, id]);
        return result.rows[0];
    }

    public async getStaffById(tenantId: number, id: number) {
        const query = `
            SELECT s.*, u.email
            FROM school.staff s
            JOIN auth.user u ON s.user_id = u.id
            WHERE s.tenant_id = $1 AND s.id = $2 AND s.is_deleted = FALSE
        `;
        const result = await this.db.query(query, [tenantId, id]);
        return result.rows[0];
    }

    public async findByUserId(tenantId: number, userId: number) {
        const query = `
            SELECT s.*
            FROM school.staff s
            WHERE s.tenant_id = $1 AND s.user_id = $2 AND s.is_deleted = FALSE
        `;
        const result = await this.db.query(query, [tenantId, userId]);
        return result.rows[0];
    }
}
