import { inject, injectable } from "tsyringe";
import { Pool, PoolClient } from "pg";
import GeneralLedgerService from "../../accounts/services/GeneralLedgerService.js";
import SystemMappingHelper from "../../accounts/helpers/SystemMappingHelper.js";
import InvoiceHelper from "../../accounts/helpers/InvoiceHelper.js";
import PartnerHelper from "../../accounts/helpers/PartnerHelper.js";

@injectable()
export default class FeeAutomationService {
    constructor(
        @inject("DB") private db: Pool,
        private glService: GeneralLedgerService,
        private mappingHelper: SystemMappingHelper,
        private invoiceHelper: InvoiceHelper,
        private partnerHelper: PartnerHelper
    ) {}

    /**
     * Processes a fee assignment (e.g., Admission, Tuition, Transport).
     * Creates:
     * 1. Invoice
     * 2. Accounts Receivable Journal (Debit AR, Credit Revenue)
     */
    public async processFeeAssignment(tenantId: number, userId: number, data: {
        studentId: number;
        studentName: string;
        amount: number;
        category: 'admission' | 'tuition' | 'transport' | 'hostel' | 'miscellaneous';
        reference: string;
        academicYearId: number;
        dueDate?: Date;
        schoolId?: number;
        gradeId?: number;
    }) {
        if (data.amount <= 0) return;

        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // 1. Create Unified Invoice
            const invoiceRes = await client.query(
                `INSERT INTO accounting.fee_invoice
                    (tenant_id, invoice_no, student_id, academic_year_id, 
                     total_amount, discount_amount, tax_amount, net_amount, due_amount, 
                     status, source_type, due_date, notes)
                 VALUES ($1, $2, $3, $4, $5, 0, 0, $5, $5, 'unpaid', $6, $7, $8)
                 RETURNING *`,
                [
                    tenantId, data.reference, data.studentId, data.academicYearId,
                    data.amount, data.category, data.dueDate || new Date(),
                    `${data.category.toUpperCase()} fee assignment for ${data.studentName}`
                ]
            );
            const invoice = invoiceRes.rows[0];

            // 3. Resolve Accounts
            const arAccount = await this.mappingHelper.getMappedAccount(tenantId, 'ASSET_RECEIVABLE');
            const revenueAccountKey = this.getRevenueKeyForCategory(data.category);
            const revenueAccount = await this.mappingHelper.getMappedAccount(tenantId, revenueAccountKey);

            if (!arAccount || !revenueAccount) {
                throw new Error(`Financial mappings missing for category: ${data.category}. Please check COA mappings.`);
            }

            // 4. Post Journal Entry
            await this.glService.postJournal(tenantId, userId, {
                entry_date: new Date(),
                reference_no: data.reference,
                description: `${data.category.charAt(0).toUpperCase() + data.category.slice(1)} fee recognition: ${data.studentName}`,
                transaction_type: `fee_${data.category}`,
                metadata: { invoice_id: invoice.id, student_id: data.studentId },
                items: [
                    { 
                        account_id: arAccount, 
                        debit: data.amount, 
                        credit: 0, 
                        partner_id: data.studentId, 
                        partner_type: 'student',
                        school_id: data.schoolId,
                        grade_id: data.gradeId
                    },
                    { 
                        account_id: revenueAccount, 
                        debit: 0, 
                        credit: data.amount, 
                        partner_id: data.studentId, 
                        partner_type: 'student',
                        school_id: data.schoolId,
                        grade_id: data.gradeId
                    }
                ]
            }, client);

            await client.query('COMMIT');
            return invoice;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Processes a fee payment.
     * Updates:
     * 1. Payment records
     * 2. Payment allocations (to close invoices)
     * 3. Journal (Debit Cash/Bank, Credit AR)
     */
    public async processFeePayment(tenantId: number, userId: number, data: {
        studentId: number;
        studentName: string;
        invoiceId: number;
        amount: number;
        paymentMethod: string;
        reference: string;
        schoolId?: number;
        gradeId?: number;
    }) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // 1. Record Base Payment
            const paymentRes = await client.query(
                `INSERT INTO accounting.fee_payment 
                    (tenant_id, invoice_id, amount, payment_method, payment_date, receipt_no, received_by, student_id)
                 VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7)
                 RETURNING id`,
                [tenantId, data.invoiceId, data.amount, data.paymentMethod, data.reference, userId, data.studentId]
            );
            const paymentId = paymentRes.rows[0].id;

            // 2. Create Payment Allocation (The source of truth for "Paid" status)
            await client.query(
                `INSERT INTO accounting.fee_payment_allocation 
                    (tenant_id, payment_id, invoice_id, amount)
                 VALUES ($1, $2, $3, $4)`,
                [tenantId, paymentId, data.invoiceId, data.amount]
            );

            // 3. Cache Invoice status (Denormalized for performance, but verifiable via allocations)
            await client.query(
                `UPDATE accounting.fee_invoice 
                 SET paid_amount = paid_amount + $1, 
                     due_amount = due_amount - $1,
                     status = CASE WHEN (due_amount - $1) <= 0 THEN 'paid' ELSE 'partial' END
                 WHERE id = $2 AND tenant_id = $3`,
                [data.amount, data.invoiceId, tenantId]
            );

            // 4. Resolve Accounts
            const arAccount = await this.mappingHelper.getMappedAccount(tenantId, 'ASSET_RECEIVABLE');
            const cashAccountKey = data.paymentMethod.toLowerCase() === 'bank' ? 'ASSET_BANK' : 'ASSET_CASH';
            const cashAccount = await this.mappingHelper.getMappedAccount(tenantId, cashAccountKey);

            if (!arAccount || !cashAccount) {
                throw new Error("Financial mappings missing for Cash/AR. Please check COA mappings.");
            }

            // 5. Post Journal Entry
            await this.glService.postJournal(tenantId, userId, {
                entry_date: new Date(),
                reference_no: data.reference,
                description: `Fee payment receipt: ${data.studentName}`,
                transaction_type: 'fee_payment',
                metadata: { payment_id: paymentId, invoice_id: data.invoiceId, student_id: data.studentId },
                items: [
                    { 
                        account_id: cashAccount, 
                        debit: data.amount, 
                        credit: 0,
                        school_id: data.schoolId,
                        grade_id: data.gradeId
                    },
                    { 
                        account_id: arAccount, 
                        debit: 0, 
                        credit: data.amount, 
                        partner_id: data.studentId, 
                        partner_type: 'student',
                        school_id: data.schoolId,
                        grade_id: data.gradeId
                    }
                ]
            }, client);

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    public async postPayrollJournal(tenantId: number, userId: number, data: {
        staffId: number;
        amount: number;
        reference: string;
        month: number;
        year: number;
    }) {
        const expenseAccount = await this.mappingHelper.getMappedAccount(tenantId, 'EXP_SALARY');
        const bankAccount = await this.mappingHelper.getMappedAccount(tenantId, 'ASSET_BANK');

        if (!expenseAccount || !bankAccount) {
            throw new Error("Financial mappings missing for Payroll (EXP_SALARY/ASSET_BANK).");
        }

        await this.glService.postJournal(tenantId, userId, {
            entry_date: new Date(),
            reference_no: data.reference,
            description: `Monthly salary payment - ${data.month}/${data.year}`,
            transaction_type: 'payroll_payment',
            metadata: { staff_id: data.staffId, month: data.month, year: data.year },
            items: [
                { 
                    account_id: expenseAccount, 
                    debit: data.amount, 
                    credit: 0,
                    partner_id: data.staffId,
                    partner_type: 'employee'
                },
                { 
                    account_id: bankAccount, 
                    debit: 0, 
                    credit: data.amount
                }
            ]
        });
    }

    private getRevenueKeyForCategory(category: string): string {
        switch (category) {
            case 'admission': return 'REV_ADMISSION';
            case 'tuition': return 'REV_TUITION';
            case 'transport': return 'REV_TRANSPORT';
            case 'hostel': return 'REV_HOSTEL';
            default: return 'REV_MISC';
        }
    }
}
