import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class PayrollHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async getSalaryStructure(tenantId: number, staffId: number): Promise<any> {
        const res = await this.db.query(
            `SELECT * FROM school.salary_structure WHERE tenant_id = $1 AND staff_id = $2 AND is_active = TRUE`,
            [tenantId, staffId]
        );
        return res.rows[0];
    }

    public async upsertSalaryStructure(data: any): Promise<any> {
        const res = await this.db.query(
            `INSERT INTO school.salary_structure 
                (tenant_id, staff_id, base_salary, allowances, deductions, bank_name, account_number, ifsc_code)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (staff_id, tenant_id) DO UPDATE SET
                base_salary = EXCLUDED.base_salary,
                allowances = EXCLUDED.allowances,
                deductions = EXCLUDED.deductions,
                bank_name = EXCLUDED.bank_name,
                account_number = EXCLUDED.account_number,
                ifsc_code = EXCLUDED.ifsc_code,
                updated_at = NOW()
             RETURNING *`,
            [
                data.tenant_id, data.staff_id, data.base_salary, 
                JSON.stringify(data.allowances || []), 
                JSON.stringify(data.deductions || []),
                data.bank_name, data.account_number, data.ifsc_code
            ]
        );
        return res.rows[0];
    }

    public async createPayslip(data: any): Promise<any> {
        const res = await this.db.query(
            `INSERT INTO school.payslip 
                (tenant_id, staff_id, month, year, base_salary, total_allowances, total_deductions, net_salary, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'generated') RETURNING *`,
            [
                data.tenant_id, data.staff_id, data.month, data.year, 
                data.base_salary, data.total_allowances, data.total_deductions, data.net_salary
            ]
        );
        return res.rows[0];
    }

    public async updatePayslipStatus(tenantId: number, id: number, status: string, entryId?: number): Promise<any> {
        const res = await this.db.query(
            `UPDATE school.payslip 
             SET status = $1, accounting_entry_id = $2, paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END
             WHERE id = $3 AND tenant_id = $4 RETURNING *`,
            [status, entryId || null, id, tenantId]
        );
        return res.rows[0];
    }

    public async getStaffPayslips(tenantId: number, staffId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT * FROM school.payslip WHERE tenant_id = $1 AND staff_id = $2 ORDER BY year DESC, month DESC`,
            [tenantId, staffId]
        );
        return res.rows;
    }
}
