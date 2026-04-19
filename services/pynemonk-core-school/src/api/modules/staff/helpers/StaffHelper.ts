import { injectable, inject } from "tsyringe";
import BaseModel from "../../../core/models/BaseModel.js";

@injectable()
export default class StaffHelper extends BaseModel {
    constructor(@inject("DB") private db: any) {
        super();
    }

    public async findAll(tenantId: number) {
        const query = `
            SELECT s.*
            FROM school.staff s
            WHERE s.tenant_id = $1 AND s.is_deleted = FALSE
            ORDER BY s.created_at DESC
        `;
        const result = await this.db.query(query, [tenantId]);
        return result.rows;
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
                specialization, joining_date, designation, avatar_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;
        const values = [
            data.tenant_id, data.user_id, data.employee_code, data.first_name, data.last_name,
            data.gender, data.date_of_birth, data.phone, data.address, data.qualification,
            data.specialization, data.joining_date, data.designation, data.avatar_url
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
                updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2 AND is_deleted = FALSE
            RETURNING *
        `;
        const values = [
            tenantId, id, data.employee_code, data.first_name, data.last_name,
            data.gender, data.date_of_birth, data.phone, data.address, data.qualification,
            data.specialization, data.joining_date, data.designation, data.avatar_url
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
