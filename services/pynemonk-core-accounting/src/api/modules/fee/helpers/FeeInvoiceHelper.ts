import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class FeeInvoiceHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async createInvoice(tenantId: number, data: {
        invoice_no: string;
        student_id: number;
        academic_year_id: number;
        installment_id: number;
        total_amount: number;
        discount_amount: number;
        tax_amount: number;
        net_amount: number;
        due_date: Date;
    }, db: Pool | any = this.db): Promise<any> {
        const res = await db.query(
            `INSERT INTO accounting.fee_invoice
                (tenant_id, invoice_no, student_id, academic_year_id, installment_id, 
                 total_amount, discount_amount, tax_amount, net_amount, due_amount, due_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                tenantId,
                data.invoice_no,
                data.student_id,
                data.academic_year_id,
                data.installment_id,
                data.total_amount,
                data.discount_amount,
                data.tax_amount,
                data.net_amount,
                data.net_amount, // due_amount initially same as net_amount
                data.due_date
            ]
        );
        return res.rows[0];
    }

    public async getPendingInvoices(tenantId: number, studentId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT * FROM accounting.fee_invoice
             WHERE tenant_id = $1 AND student_id = $2 AND status IN ('unpaid', 'partial') AND is_deleted = FALSE
             ORDER BY due_date ASC`,
            [tenantId, studentId]
        );
        return res.rows;
    }

    public async findByInstallmentAndStudent(tenantId: number, installmentId: number, studentId: number): Promise<any> {
        const res = await this.db.query(
            `SELECT * FROM accounting.fee_invoice
             WHERE tenant_id = $1 AND installment_id = $2 AND student_id = $3 AND is_deleted = FALSE`,
            [tenantId, installmentId, studentId]
        );
        return res.rows[0];
    }

    public async generateInvoiceNumber(tenantId: number): Promise<string> {
        const res = await this.db.query(
            `SELECT count(*) as count FROM accounting.fee_invoice WHERE tenant_id = $1`,
            [tenantId]
        );
        const nextId = parseInt(res.rows[0].count) + 1;
        const year = new Date().getFullYear().toString().slice(-2);
        return `INV/${year}/${nextId.toString().padStart(5, '0')}`;
    }
}
