import { injectable, inject } from "tsyringe";
import pool from "../../../../db/pg-pool.js";
import BaseModel from "../../../core/models/BaseModel.js";

@injectable()
export default class FeePaymentHelper extends BaseModel {
    constructor(@inject("DB") private db: any) {
        super();
    }

    public async findAll(tenantId: number) {
        const query = `
            SELECT p.*, i.invoice_no, i.total_amount as invoice_amount
            FROM accounting.fee_payment p
            JOIN accounting.fee_invoice i ON p.invoice_id = i.id
            WHERE p.tenant_id = $1 AND p.is_deleted = FALSE
            ORDER BY p.payment_date DESC
        `;
        const result = await pool.query(query, [tenantId]);
        return result.rows;
    }

    public async findById(tenantId: number, id: number) {
        const query = `
            SELECT p.*, i.invoice_no, i.total_amount as invoice_amount
            FROM accounting.fee_payment p
            JOIN accounting.fee_invoice i ON p.invoice_id = i.id
            WHERE p.tenant_id = $1 AND p.id = $2 AND p.is_deleted = FALSE
        `;
        const result = await pool.query(query, [tenantId, id]);
        return result.rows[0];
    }

    public async create(data: any) {
        const query = `
            INSERT INTO accounting.fee_payment (
                tenant_id, invoice_id, amount, payment_method, 
                payment_gateway, payment_gateway_ref, payment_date, 
                receipt_no, notes, received_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const values = [
            data.tenant_id, data.invoice_id, data.amount, data.payment_method,
            data.payment_gateway, data.payment_gateway_ref, data.payment_date,
            data.receipt_no, data.notes, data.received_by
        ];
        const result = await pool.query(query, values);
        
        // Update invoice paid amount
        await pool.query(
            "UPDATE accounting.fee_invoice SET paid_amount = paid_amount + $1, updated_at = NOW() WHERE id = $2",
            [data.amount, data.invoice_id]
        );
        
        return result.rows[0];
    }

    public async delete(tenantId: number, id: number) {
        // Get payment info first to revert invoice paid amount
        const payment = await this.findById(tenantId, id);
        if (payment) {
            await pool.query(
                "UPDATE accounting.fee_invoice SET paid_amount = paid_amount - $1, updated_at = NOW() WHERE id = $2",
                [payment.amount, payment.invoice_id]
            );
        }

        const query = `
            UPDATE accounting.fee_payment SET is_deleted = TRUE, updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
            RETURNING id
        `;
        const result = await pool.query(query, [tenantId, id]);
        return result.rows[0];
    }
}
