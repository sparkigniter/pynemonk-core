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
        bankAccountId?: number;
        schoolId?: number;
        gradeId?: number;
    }) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // 1. Verify/Auto-create Invoice if virtual
            let invCheck = await client.query(
                `SELECT id, 'fee' as type FROM accounting.fee_invoice WHERE id = $1 AND tenant_id = $2`,
                [data.invoiceId, tenantId]
            );

            if (invCheck.rows.length === 0) {
                // Check if it's a generic/manual invoice
                const genCheck = await client.query(
                    `SELECT id, 'manual' as type FROM accounting.invoice WHERE id = $1 AND tenant_id = $2`,
                    [data.invoiceId, tenantId]
                );
                
                if (genCheck.rows.length > 0) {
                    invCheck = genCheck;
                }
            }

            if (invCheck.rows.length === 0) {
                // This might be a virtual invoice from school.fee_installment. 
                // We need to formalize it in accounting.fee_invoice first.
                const instRes = await client.query(
                    `SELECT fi.id, fi.amount_due, fi.due_date, sfa.student_id 
                     FROM school.fee_installment fi
                     JOIN school.student_fee_allocation sfa ON fi.allocation_id = sfa.id
                     WHERE fi.id = $1 AND sfa.tenant_id = $2`,
                    [data.invoiceId, tenantId]
                );
                
                if (instRes.rows.length > 0) {
                    const inst = instRes.rows[0];
                    // 1. Create the invoice record
                    await client.query(
                        `INSERT INTO accounting.fee_invoice (id, tenant_id, student_id, total_amount, net_amount, due_amount, due_date, status, source_type)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, 'unpaid', 'fee_allocation')`,
                        [data.invoiceId, tenantId, inst.student_id, inst.amount_due, inst.amount_due, inst.amount_due, inst.due_date]
                    );

                    // 2. Resolve Accounts for Invoice Recognition
                    const arAccount = await this.mappingHelper.getMappedAccount(tenantId, 'ASSET_RECEIVABLE');
                    const revenueAccount = await this.mappingHelper.getMappedAccount(tenantId, 'REV_TUITION'); // Default to tuition for allocations

                    if (arAccount && revenueAccount) {
                        // 3. Post Journal Entry for Invoice Recognition (Debit AR, Credit Revenue)
                        await this.glService.postJournal(tenantId, userId, {
                            entry_date: new Date(),
                            reference_no: `INV-${data.invoiceId}`,
                            description: `Fee Recognition (Auto-Formalized): ${data.studentName}`,
                            transaction_type: 'fee_allocation',
                            metadata: { invoice_id: data.invoiceId, student_id: inst.student_id },
                            items: [
                                { 
                                    account_id: arAccount, 
                                    debit: inst.amount_due, 
                                    credit: 0, 
                                    partner_id: inst.student_id, 
                                    partner_type: 'student'
                                },
                                { 
                                    account_id: revenueAccount, 
                                    debit: 0, 
                                    credit: inst.amount_due, 
                                    partner_id: inst.student_id, 
                                    partner_type: 'student'
                                }
                            ]
                        }, client);
                    }
                }
            }

            // 2. Record Base Payment
            const paymentRes = await client.query(
                `INSERT INTO accounting.fee_payment 
                    (tenant_id, invoice_id, amount, payment_method, payment_date, receipt_no, received_by, student_id, bank_account_id)
                 VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8)
                 RETURNING id`,
                [tenantId, data.invoiceId, data.amount, data.paymentMethod, data.reference, userId, data.studentId, data.bankAccountId]
            );
            const paymentId = paymentRes.rows[0].id;

            // 2. Create Payment Allocation
            await client.query(
                `INSERT INTO accounting.fee_payment_allocation 
                    (tenant_id, payment_id, invoice_id, amount)
                 VALUES ($1, $2, $3, $4)`,
                [tenantId, paymentId, data.invoiceId, data.amount]
            );

            // 3. Update Invoice Balance
            const invoiceType = invCheck.rows[0]?.type || 'fee';
            const invoiceTable = invoiceType === 'manual' ? 'accounting.invoice' : 'accounting.fee_invoice';
            
            await client.query(
                `UPDATE ${invoiceTable} 
                 SET paid_amount = paid_amount + $1, 
                     due_amount = due_amount - $1,
                     status = CASE WHEN (due_amount - $1) <= 0 THEN 'paid' ELSE 'partial' END
                 WHERE id = $2 AND tenant_id = $3`,
                [data.amount, data.invoiceId, tenantId]
            );

            // 4. Resolve Accounts
            const arAccount = await this.mappingHelper.getMappedAccount(tenantId, 'ASSET_RECEIVABLE');
            let cashAccount: number | null = null;

            if (data.paymentMethod.toLowerCase() === 'bank' && data.bankAccountId) {
                // If specific bank account is provided, use its GL account
                const bankRes = await client.query(
                    `SELECT gl_account_id FROM accounting.bank_account WHERE id = $1 AND tenant_id = $2`,
                    [data.bankAccountId, tenantId]
                );
                if (bankRes.rows.length > 0 && bankRes.rows[0].gl_account_id) {
                    cashAccount = bankRes.rows[0].gl_account_id;
                }
            }

            if (!cashAccount) {
                // Fallback to default mappings
                const cashAccountKey = data.paymentMethod.toLowerCase() === 'bank' ? 'ASSET_BANK' : 'ASSET_CASH';
                cashAccount = await this.mappingHelper.getMappedAccount(tenantId, cashAccountKey);
            }

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

            // 6. SYNC BACK TO SCHOOL MODULE: Update the school.fee_installment if linked
            await client.query(`
                UPDATE school.fee_installment fi
                SET 
                    amount_paid = amount_paid + $1,
                    status = CASE 
                        WHEN (amount_due - (amount_paid + $1)) <= 0 THEN 'PAID'
                        WHEN (amount_due - (amount_paid + $1)) < amount_due THEN 'PARTIAL'
                        ELSE 'UNPAID'
                    END,
                    last_payment_date = CURRENT_DATE
                FROM school.student_fee_allocation sfa
                WHERE fi.allocation_id = sfa.id 
                  AND fi.invoice_id = $2
                  AND sfa.tenant_id = $3`,
                [data.amount, data.invoiceId, tenantId]
            );

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
        payslipId?: number;
    }) {
        const expenseAccount = await this.mappingHelper.getMappedAccount(tenantId, 'EXP_SALARY');
        const bankAccount = await this.mappingHelper.getMappedAccount(tenantId, 'ASSET_BANK');

        if (!expenseAccount || !bankAccount) {
            throw new Error("Financial mappings missing for Payroll (EXP_SALARY/ASSET_BANK).");
        }

        const journalId = await this.glService.postJournal(tenantId, userId, {
            entry_date: new Date(),
            reference_no: data.reference,
            description: `Monthly salary payment - ${data.month}/${data.year}`,
            transaction_type: 'payroll_payment',
            metadata: { staff_id: data.staffId, month: data.month, year: data.year, payslip_id: data.payslipId },
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

        if (data.payslipId) {
            await this.db.query(
                `UPDATE school.payslip SET accounting_entry_id = $1 WHERE id = $2 AND tenant_id = $3`,
                [journalId, data.payslipId, tenantId]
            );
        }
    }

    public async processPayrollBillGeneration(tenantId: number, data: {
        payslipId: number;
        staffId: number;
        month: number;
        year: number;
        netSalary: number;
        fullName: string;
    }) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // 1. Check if a vendor already exists for this staff member
            let vendorId: number;
            const vendorRes = await client.query(
                `SELECT id FROM accounting.vendor WHERE tenant_id = $1 AND name = $2 AND is_deleted = FALSE LIMIT 1`,
                [tenantId, data.fullName]
            );

            if (vendorRes.rows.length > 0) {
                vendorId = vendorRes.rows[0].id;
            } else {
                // Auto-create a vendor for the staff member
                const code = `EMP-VND-${data.staffId}`;
                const emailRes = await client.query(
                    `SELECT u.email FROM school.staff s
                     JOIN auth.user u ON s.user_id = u.id
                     WHERE s.id = $1`,
                    [data.staffId]
                );
                const email = emailRes.rows[0]?.email || `staff-${data.staffId}@luvia.edu`;

                const newVendorRes = await client.query(
                    `INSERT INTO accounting.vendor 
                        (tenant_id, name, code, contact_person, email, phone, address, opening_balance)
                     VALUES ($1, $2, $3, $4, $5, '', '', 0) RETURNING id`,
                    [tenantId, data.fullName, code, data.fullName, email]
                );
                vendorId = newVendorRes.rows[0].id;
            }

            // 2. Resolve Accounts Payable account (2100) and Salary Expense account (EXP_SALARY / 5100)
            const apAccRes = await client.query(
                `SELECT id FROM accounting.chart_of_accounts WHERE tenant_id = $1 AND code = '2100' LIMIT 1`,
                [tenantId]
            );
            const apAccountId = apAccRes.rows[0]?.id;
            if (!apAccountId) throw new Error("Accounts Payable account (2100) not found");

            // Mapped Salary Expense account
            let expenseAccountId = await this.mappingHelper.getMappedAccount(tenantId, 'EXP_SALARY');
            if (!expenseAccountId) {
                const expRes = await client.query(
                    `SELECT id FROM accounting.chart_of_accounts WHERE tenant_id = $1 AND (code = '5100' OR type = 'expense') LIMIT 1`,
                    [tenantId]
                );
                expenseAccountId = expRes.rows[0]?.id;
            }
            if (!expenseAccountId) throw new Error("Salary Expense account not found");

            // 3. Create Journal Entry (Debit Salary Expense, Credit Accounts Payable)
            const billNo = `PR-${data.payslipId}`;
            const notes = `Salary Payslip for ${data.fullName} - ${data.month}/${data.year}`;
            const jeRes = await client.query(
                `INSERT INTO accounting.journal_entry (tenant_id, entry_date, reference_no, description)
                 VALUES ($1, CURRENT_DATE, $2, $3) RETURNING id`,
                [tenantId, billNo, notes]
            );
            const jeId = jeRes.rows[0].id;

            // Debit Salary Expense
            await client.query(
                `INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit, description, partner_id, partner_type)
                 VALUES ($1, $2, $3, $4, 0, $5, $6, 'employee')`,
                [tenantId, jeId, expenseAccountId, data.netSalary, `Salary Expense for ${data.fullName}`, data.staffId]
            );

            // Credit Accounts Payable
            await client.query(
                `INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit, description)
                 VALUES ($1, $2, $3, 0, $4, $5)`,
                [tenantId, jeId, apAccountId, data.netSalary, `Total Payable for Salary slip ${billNo}`]
            );

            // 4. Create Vendor Bill
            const billRes = await client.query(
                `INSERT INTO accounting.vendor_bill 
                    (tenant_id, vendor_id, bill_no, bill_date, due_date, total_amount, journal_entry_id, notes, status)
                 VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + 15, $4, $5, $6, 'open') RETURNING id`,
                [tenantId, vendorId, billNo, data.netSalary, jeId, notes]
            );
            const billId = billRes.rows[0].id;

            // 5. Update the school.payslip's accounting_entry_id to link directly to this vendor_bill
            await client.query(
                `UPDATE school.payslip SET accounting_entry_id = $1 WHERE id = $2 AND tenant_id = $3`,
                [billId, data.payslipId, tenantId]
            );

            await client.query('COMMIT');
            console.log(`[Accounting] Successfully generated AP Vendor Bill ${billId} (${billNo}) for Payslip ${data.payslipId}`);
        } catch (err: any) {
            await client.query('ROLLBACK');
            console.error(`[Accounting] Failed to auto-generate AP Bill for Payslip: ${err.message}`);
            throw err;
        } finally {
            client.release();
        }
    }

    public async processPayrollPayment(tenantId: number, userId: number, data: {
        payslipId: number;
        staffId: number;
        amount: number;
        month: number;
        year: number;
        reference: string;
    }) {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // 1. Retrieve the linked vendor bill from school.payslip
            const payslipRes = await client.query(
                `SELECT accounting_entry_id FROM school.payslip WHERE id = $1 AND tenant_id = $2`,
                [data.payslipId, tenantId]
            );
            const billId = payslipRes.rows[0]?.accounting_entry_id;

            if (!billId) {
                console.warn(`[Accounting] No AP Bill found associated with Payslip ${data.payslipId}. Falling back to standard direct journal.`);
                await client.query('COMMIT');
                await this.postPayrollJournal(tenantId, userId, data);
                return;
            }

            // 2. Fetch the vendor bill details
            const billRes = await client.query(
                `SELECT * FROM accounting.vendor_bill WHERE id = $1 AND tenant_id = $2`,
                [billId, tenantId]
            );
            const bill = billRes.rows[0];
            if (!bill) {
                console.warn(`[Accounting] Vendor Bill ${billId} not found. Falling back to direct journal.`);
                await client.query('COMMIT');
                await this.postPayrollJournal(tenantId, userId, data);
                return;
            }

            if (bill.status === 'paid') {
                console.log(`[Accounting] Bill ${billId} is already marked as paid.`);
                await client.query('COMMIT');
                return;
            }

            // 3. Resolve Bank GL Account and AP Account (2100)
            let bankAccountId = await this.mappingHelper.getMappedAccount(tenantId, 'ASSET_BANK');
            if (!bankAccountId) {
                const bankRes = await client.query(
                    `SELECT gl_account_id FROM accounting.bank_account WHERE tenant_id = $1 AND is_active = TRUE LIMIT 1`,
                    [tenantId]
                );
                bankAccountId = bankRes.rows[0]?.gl_account_id;
            }
            if (!bankAccountId) throw new Error("Bank account GL mapping not found");

            const apAccRes = await client.query(
                `SELECT id FROM accounting.chart_of_accounts WHERE tenant_id = $1 AND code = '2100' LIMIT 1`,
                [tenantId]
            );
            const apAccountId = apAccRes.rows[0]?.id;

            // 4. Create Journal Entry (Debit AP, Credit Bank)
            const jeRes = await client.query(
                `INSERT INTO accounting.journal_entry (tenant_id, entry_date, reference_no, description)
                 VALUES ($1, CURRENT_DATE, $2, $3) RETURNING id`,
                [tenantId, data.reference, `Salary Bill Payment for Payslip PR-${data.payslipId}`]
            );
            const jeId = jeRes.rows[0].id;

            // Debit Accounts Payable (AP)
            await client.query(
                `INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit, description)
                 VALUES ($1, $2, $3, $4, 0, $5)`,
                [tenantId, jeId, apAccountId, data.amount, `Debit AP for Salary Slip Payment`]
            );

            // Credit Bank Account
            await client.query(
                `INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit, description)
                 VALUES ($1, $2, $3, 0, $4, $5)`,
                [tenantId, jeId, bankAccountId, data.amount, `Credit Bank for Salary Slip Payment`]
            );

            // 5. Create Bill Payment record
            const payRes = await client.query(
                `INSERT INTO accounting.bill_payment 
                    (tenant_id, vendor_id, payment_date, amount, payment_method, reference_no, journal_entry_id)
                 VALUES ($1, $2, CURRENT_DATE, $3, 'bank_transfer', $4, $5) RETURNING id`,
                [tenantId, bill.vendor_id, data.amount, data.reference, jeId]
            );
            const paymentId = payRes.rows[0].id;

            // 6. Create Bill Payment Allocation
            await client.query(
                `INSERT INTO accounting.bill_payment_allocation (tenant_id, payment_id, bill_id, amount)
                 VALUES ($1, $2, $3, $4)`,
                [tenantId, paymentId, billId, data.amount]
            );

            // 7. Update Bill Status to Paid
            await client.query(
                `UPDATE accounting.vendor_bill 
                 SET paid_amount = paid_amount + $1,
                     status = CASE 
                         WHEN (paid_amount + $1) >= total_amount THEN 'paid'
                         ELSE 'partial'
                     END
                 WHERE id = $2`,
                [data.amount, billId]
            );

            await client.query('COMMIT');
            console.log(`[Accounting] Successfully recorded payment for AP Bill ${billId} and matched with Payslip ${data.payslipId}`);
        } catch (err: any) {
            await client.query('ROLLBACK');
            console.error(`[Accounting] Failed to record payment for AP Bill: ${err.message}`);
            throw err;
        } finally {
            client.release();
        }
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
