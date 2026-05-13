import { inject, injectable } from "tsyringe";
import { EventEmitter } from "events";
import FeeAutomationService from "../../fee/services/FeeAutomationService.js";

@injectable()
export default class AccountingAutomationSubscriber {
    constructor(
        @inject("EventBus") private eventBus: EventEmitter,
        private feeAutomation: FeeAutomationService
    ) {}

    public init() {
        console.log("[Accounting] Initializing Enterprise Automation Hub...");

        /**
         * 1. NEW ADMISSION (Real-time Recognition)
         */
        this.eventBus.on('ADMISSION_COMPLETED', async (data) => {
            console.log(`[AccountingSubscriber] <<< EVENT RECEIVED: ADMISSION_COMPLETED`);
            console.log(`[AccountingSubscriber] Payload: ${JSON.stringify(data)}`);
            try {
                console.log(`[Accounting] Processing admission financials for student ${data.studentId}`);
                
                // 1. Recognize Revenue & Create Invoice
                const invoice: any = await this.feeAutomation.processFeeAssignment(data.tenantId, data.userId || 0, {
                    studentId: data.studentId,
                    studentName: data.studentName,
                    amount: data.amount,
                    category: 'admission',
                    reference: data.reference,
                    academicYearId: data.academicYearId
                });

                if (invoice) {
                    console.log(`[Accounting] Invoice created: ${invoice.id} (${invoice.invoice_no})`);
                } else {
                    console.warn(`[Accounting] No invoice created (amount may be 0 or returned null)`);
                }

                // 2. Process payment if any amount was paid
                const amountPaid = data.amountPaid ?? (data.isPaid ? data.amount : 0);
                if (amountPaid > 0 && invoice) {
                    console.log(`[Accounting] Processing payment of ${amountPaid} for invoice ${invoice.id}`);
                    await this.feeAutomation.processFeePayment(data.tenantId, data.userId || 0, {
                        studentId: data.studentId,
                        studentName: data.studentName,
                        invoiceId: invoice.id,
                        amount: amountPaid,
                        paymentMethod: data.paymentMethod || 'Cash',
                        reference: `RCPT-${data.reference}`
                    });
                    console.log(`[Accounting] Payment processed successfully`);
                }
            } catch (err: any) {
                console.error(`[Accounting] CRITICAL: Admission integration failure!`);
                console.error(`[Accounting] Error: ${err.message}`);
                console.error(err.stack);
            }
        });

        /**
         * 2. TRANSPORT ASSIGNMENT
         */
        this.eventBus.on('TRANSPORT_ASSIGNED', async (data) => {
            try {
                console.log(`[Accounting] Processing transport fee assignment for student ${data.studentId}`);
                await this.feeAutomation.processFeeAssignment(data.tenantId, data.userId || 0, {
                    studentId: data.studentId,
                    studentName: data.studentName,
                    amount: data.monthlyFee,
                    category: 'transport',
                    reference: `TRP-${Date.now()}`,
                    academicYearId: data.academicYearId
                });
            } catch (err: any) {
                console.error(`[Accounting] Transport integration error: ${err.message}`);
            }
        });

        /**
         * 3. HOSTEL ALLOCATION
         */
        this.eventBus.on('HOSTEL_ALLOCATED', async (data) => {
            try {
                console.log(`[Accounting] Processing hostel fee assignment for student ${data.studentId}`);
                await this.feeAutomation.processFeeAssignment(data.tenantId, data.userId || 0, {
                    studentId: data.studentId,
                    studentName: data.studentName,
                    amount: data.baseFee,
                    category: 'hostel',
                    reference: `HST-${Date.now()}`,
                    academicYearId: data.academicYearId
                });
            } catch (err: any) {
                console.error(`[Accounting] Hostel integration error: ${err.message}`);
            }
        });

        /**
         * 4. MANUAL FEE ASSIGNMENT (Miscellaneous)
         */
        this.eventBus.on('FEE_ASSIGNED', async (data) => {
            try {
                await this.feeAutomation.processFeeAssignment(data.tenantId, data.userId || 0, {
                    studentId: data.studentId,
                    studentName: data.studentName,
                    amount: data.amount,
                    category: data.category || 'miscellaneous',
                    reference: data.reference || `FEE-${Date.now()}`,
                    academicYearId: data.academicYearId
                });
            } catch (err: any) {
                console.error(`[Accounting] Generic fee assignment error: ${err.message}`);
            }
        });

        /**
         * 5. PAYMENT COLLECTION (Ar Recognition)
         */
        this.eventBus.on('FEE_COLLECTION_COMPLETED', async (data) => {
            try {
                console.log(`[Accounting] Processing payment receipt for student ${data.studentId}`);
                await this.feeAutomation.processFeePayment(data.tenantId, data.userId || 0, {
                    studentId: data.studentId,
                    studentName: data.studentName,
                    invoiceId: data.invoiceId,
                    amount: data.amount,
                    paymentMethod: data.paymentMethod || 'Cash',
                    reference: data.reference
                });
            } catch (err: any) {
                console.error(`[Accounting] Payment collection error: ${err.message}`);
            }
        });
        /**
         * 6. PAYROLL PAYMENT (Expense Recognition)
         */
        this.eventBus.on('PAYROLL_PAID', async (data) => {
            try {
                console.log(`[Accounting] Processing payroll payment for staff ${data.staffId}`);
                await this.feeAutomation.postPayrollJournal(data.tenantId, data.userId, data);
            } catch (err: any) {
                console.error(`[Accounting] Payroll integration error: ${err.message}`);
            }
        });
    }
}
