import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

export interface StudentFinancialStatus {
    student_id: number;
    tenant_id: number;
    total_invoiced: number;
    total_paid: number;
    outstanding_balance: number;
    financial_status: 'paid' | 'unpaid' | 'partial' | 'overdue' | 'no_invoices';
}

@injectable()
export default class FeeFinancialStatusService {
    constructor(@inject("DB") private db: Pool) {}

    /**
     * DERIVED TRUTH ENGINE:
     * Calculates the real-time financial standing of a student by
     * aggregating all invoices and their respective payment allocations.
     * This avoids synchronization bugs by treating allocations as the source of truth.
     */
    public async getStudentStatus(tenantId: number, studentId: number): Promise<StudentFinancialStatus> {
        const res = await this.db.query(
            `SELECT * FROM accounting.v_student_financial_status 
             WHERE tenant_id = $1 AND student_id = $2`,
            [tenantId, studentId]
        );

        if (res.rows.length === 0) {
            return {
                student_id: studentId,
                tenant_id: tenantId,
                total_invoiced: 0,
                total_paid: 0,
                outstanding_balance: 0,
                financial_status: 'no_invoices'
            };
        }

        const data = res.rows[0];
        
        // Final sanity check for "overdue" logic (if not fully handled by view)
        let status = data.financial_status;
        if (status !== 'paid' && status !== 'no_invoices') {
            const overdueRes = await this.db.query(
                `SELECT 1 FROM accounting.fee_invoice 
                 WHERE tenant_id = $1 AND student_id = $2 
                 AND due_date < CURRENT_DATE AND status IN ('unpaid', 'partial')
                 LIMIT 1`,
                [tenantId, studentId]
            );
            if (overdueRes.rows.length > 0) {
                status = 'overdue';
            }
        }

        return {
            ...data,
            total_invoiced: parseFloat(data.total_invoiced),
            total_paid: parseFloat(data.total_paid),
            outstanding_balance: parseFloat(data.outstanding_balance),
            financial_status: status
        };
    }

    /**
     * Bulk retrieval of financial summaries for a classroom or tenant.
     */
    public async getSummaryReport(tenantId: number, filters: { schoolId?: number, gradeId?: number } = {}): Promise<any> {
        // Implement complex aggregation for dashboards
        const res = await this.db.query(
            `SELECT 
                financial_status,
                count(*) as student_count,
                sum(outstanding_balance) as total_outstanding
             FROM accounting.v_student_financial_status
             WHERE tenant_id = $1
             GROUP BY financial_status`,
            [tenantId]
        );
        return res.rows;
    }
}
