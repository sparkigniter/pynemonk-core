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
            SELECT s.*, COUNT(*) OVER() as total_count
            FROM school.staff s
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

    public async create(data: any) {
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
            data.tenant_id,
            data.user_id,
            data.employee_code,
            data.first_name,
            data.last_name,
            data.gender,
            data.date_of_birth,
            data.phone,
            data.address,
            data.qualification,
            data.specialization,
            data.joining_date,
            data.designation,
            data.avatar_url,
            data.blood_group,
            data.religion,
            data.nationality,
            data.emergency_contact_name,
            data.emergency_contact_phone,
            data.marital_status,
            data.experience_years,
            data.status || "active",
            data.aadhaar_number,
            data.pan_number,
            data.bank_account_no,
            data.bank_name,
            data.ifsc_code,
        ];
        const result = await this.db.query(query, values);
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
            data.employee_code,
            data.first_name,
            data.last_name,
            data.gender,
            data.date_of_birth,
            data.phone,
            data.address,
            data.qualification,
            data.specialization,
            data.joining_date,
            data.designation,
            data.avatar_url,
            data.blood_group,
            data.religion,
            data.nationality,
            data.emergency_contact_name,
            data.emergency_contact_phone,
            data.marital_status,
            data.experience_years,
            data.status,
            data.aadhaar_number,
            data.pan_number,
            data.bank_account_no,
            data.bank_name,
            data.ifsc_code,
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
            SELECT s.*, u.username, u.email
            FROM school.staff s
            JOIN auth.user u ON s.user_id = u.id
            WHERE s.tenant_id = $1 AND s.id = $2 AND s.is_deleted = FALSE
        `;
        const result = await this.db.query(query, [tenantId, id]);
        return result.rows[0];
    }
}
