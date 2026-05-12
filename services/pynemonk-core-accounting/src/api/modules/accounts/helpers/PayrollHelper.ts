import { inject, injectable } from "tsyringe";
import { Pool } from "pg";
import SystemMappingHelper from "../helpers/SystemMappingHelper.js";

@injectable()
export default class PayrollHelper {
    constructor(
        @inject("DB") private db: Pool,
        @inject(SystemMappingHelper) private mappingHelper: SystemMappingHelper
    ) {}

    public async generateMonthlySalary(tenantId: number, data: {
        staff_id: number;
        academic_year_id: number;
        month: number;
        year: number;
        gross_salary: number;
        total_deductions: number;
        net_salary: number;
        breakdown: any;
    }): Promise<any> {
        const res = await this.db.query(
            `INSERT INTO accounting.staff_salary 
                (tenant_id, staff_id, academic_year_id, month, year, gross_salary, total_deductions, net_salary, breakdown, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
             RETURNING *`,
            [
                tenantId, data.staff_id, data.academic_year_id, data.month, data.year,
                data.gross_salary, data.total_deductions, data.net_salary, data.breakdown || {}
            ]
        );
        return res.rows[0];
    }

    public async markAsPaid(tenantId: number, userId: number, salaryId: number): Promise<any> {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // 1. Get salary record
            const salaryRes = await client.query(
                `SELECT s.*, st.first_name, st.last_name 
                 FROM accounting.staff_salary s
                 JOIN school.staff st ON s.staff_id = st.id
                 WHERE s.id = $1 AND s.tenant_id = $2`,
                [salaryId, tenantId]
            );
            const salary = salaryRes.rows[0];
            if (!salary) throw new Error("Salary record not found");
            if (salary.status === 'paid') throw new Error("Salary already marked as paid");

            // 2. Update status
            await client.query(
                `UPDATE accounting.staff_salary SET status = 'paid', paid_on = CURRENT_DATE, updated_at = NOW()
                 WHERE id = $1`,
                [salaryId]
            );

            // 3. Post Automated Journal Entry
            await this.mappingHelper.postAutomatedTransaction(tenantId, userId, {
                type: 'SALARY_PAYMENT',
                amount: parseFloat(salary.net_salary),
                reference: `SAL-PAY-${salary.id}`,
                description: `Salary payment for ${salary.first_name} ${salary.last_name} - ${salary.month}/${salary.year}`
            });

            await client.query('COMMIT');
            return { success: true };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    public async getSalaries(tenantId: number, filters: any): Promise<any[]> {
        const res = await this.db.query(
            `SELECT s.*, st.first_name, st.last_name, st.employee_id
             FROM accounting.staff_salary s
             JOIN school.staff st ON s.staff_id = st.id
             WHERE s.tenant_id = $1 AND s.is_deleted = FALSE
             ORDER BY s.year DESC, s.month DESC`,
            [tenantId]
        );
        return res.rows;
    }
}
