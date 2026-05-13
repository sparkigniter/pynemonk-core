import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class LeaveHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async createLeaveType(data: any): Promise<any> {
        const res = await this.db.query(
            `INSERT INTO school.leave_type (tenant_id, name, description, is_paid, default_days)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [data.tenant_id, data.name, data.description, data.is_paid, data.default_days]
        );
        return res.rows[0];
    }

    public async getLeaveTypes(tenantId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT * FROM school.leave_type WHERE tenant_id = $1 ORDER BY name ASC`,
            [tenantId]
        );
        return res.rows;
    }

    public async createApplication(data: any): Promise<any> {
        const res = await this.db.query(
            `INSERT INTO school.leave_application 
                (tenant_id, staff_id, leave_type_id, start_date, end_date, reason, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
            [data.tenant_id, data.staff_id, data.leave_type_id, data.start_date, data.end_date, data.reason]
        );
        return res.rows[0];
    }

    public async getStaffApplications(tenantId: number, staffId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT la.*, lt.name as leave_type_name
             FROM school.leave_application la
             JOIN school.leave_type lt ON la.leave_type_id = lt.id
             WHERE la.tenant_id = $1 AND la.staff_id = $2
             ORDER BY la.created_at DESC`,
            [tenantId, staffId]
        );
        return res.rows;
    }

    public async getPendingApplications(tenantId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT la.*, lt.name as leave_type_name, s.first_name, s.last_name
             FROM school.leave_application la
             JOIN school.leave_type lt ON la.leave_type_id = lt.id
             JOIN school.staff s ON la.staff_id = s.id
             WHERE la.tenant_id = $1 AND la.status = 'pending'
             ORDER BY la.created_at ASC`,
            [tenantId]
        );
        return res.rows;
    }

    public async updateStatus(tenantId: number, id: number, data: any): Promise<any> {
        const res = await this.db.query(
            `UPDATE school.leave_application
             SET status = $1, approved_by = $2, remarks = $3, approved_at = NOW(), updated_at = NOW()
             WHERE id = $4 AND tenant_id = $5 RETURNING *`,
            [data.status, data.approved_by, data.remarks, id, tenantId]
        );
        return res.rows[0];
    }
}
