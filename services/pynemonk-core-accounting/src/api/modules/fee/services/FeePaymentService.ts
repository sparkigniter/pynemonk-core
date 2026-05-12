import { injectable, inject } from "tsyringe";
import FeePaymentHelper from "../helpers/FeePaymentHelper.js";
import FeeAutomationService from "./FeeAutomationService.js";
import GeneralLedgerService from "../../accounts/services/GeneralLedgerService.js";
import { Pool } from "pg";

@injectable()
export default class FeePaymentService {
    constructor(
        @inject(FeePaymentHelper) private feePaymentHelper: FeePaymentHelper,
        private feeAutomation: FeeAutomationService,
        private glService: GeneralLedgerService,
        @inject("DB") private db: Pool
    ) {}

    public async getPayments(tenantId: number) {
        return this.feePaymentHelper.findAll(tenantId);
    }

    public async getPaymentById(tenantId: number, id: number) {
        return this.feePaymentHelper.findById(tenantId, id);
    }

    public async recordPayment(tenantId: number, userId: number, data: any) {
        // Use the robust automation service to handle Ledger, Allocations, and Invoice updates
        return this.feeAutomation.processFeePayment(tenantId, userId, {
            studentId: data.student_id,
            studentName: data.student_name || 'Student',
            invoiceId: data.invoice_id,
            amount: data.amount,
            paymentMethod: data.payment_method,
            reference: data.receipt_no || data.reference_no || `RCPT-${Date.now()}`
        });
    }

    /**
     * Reverses a payment.
     * 1. Reverses the Journal Entry in the GL.
     * 2. Reverts the invoice balances.
     * 3. Marks payment and allocations as voided/deleted.
     */
    public async reversePayment(tenantId: number, userId: number, paymentId: number, reason: string) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // 1. Fetch payment details
            const paymentRes = await client.query(
                `SELECT * FROM accounting.fee_payment WHERE id = $1 AND tenant_id = $2`,
                [paymentId, tenantId]
            );
            if (paymentRes.rows.length === 0) throw new Error("Payment record not found.");
            const payment = paymentRes.rows[0];

            // 2. Reverse GL Entries
            // Find the journal entry associated with this payment
            const journalRes = await client.query(
                `SELECT id FROM accounting.journal_entry 
                 WHERE tenant_id = $1 AND metadata->>'payment_id' = $2`,
                [tenantId, paymentId.toString()]
            );
            
            if (journalRes.rows.length > 0) {
                await this.glService.reverseJournal(tenantId, userId, journalRes.rows[0].id, reason);
            }

            // 3. Revert Invoice Balances
            await client.query(
                `UPDATE accounting.fee_invoice 
                 SET paid_amount = paid_amount - $1, 
                     due_amount = due_amount + $1,
                     status = CASE WHEN (due_amount + $1) >= net_amount THEN 'unpaid' ELSE 'partial' END
                 WHERE id = $2 AND tenant_id = $3`,
                [payment.amount, payment.invoice_id, tenantId]
            );

            // 4. Mark as Deleted/Voided
            await client.query(
                `UPDATE accounting.fee_payment SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1`,
                [paymentId]
            );
            await client.query(
                `UPDATE accounting.fee_payment_allocation SET is_deleted = TRUE WHERE payment_id = $1`,
                [paymentId]
            );

            await client.query('COMMIT');
            return { success: true, message: "Payment reversed successfully" };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}
