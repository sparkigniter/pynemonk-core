import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import FeeInvoiceHelper from "../helpers/FeeInvoiceHelper.js";
import PartnerHelper from "../../accounts/helpers/PartnerHelper.js";
import GenericInvoiceHelper from "../../accounts/helpers/InvoiceHelper.js";
import GeneralLedgerService from "../../accounts/services/GeneralLedgerService.js";

@injectable()
export default class FeeInvoiceService {
    constructor(
        @inject("DB") private db: Pool,
        private invoiceHelper: FeeInvoiceHelper,
        private partnerHelper: PartnerHelper,
        private genericInvoiceHelper: GenericInvoiceHelper,
        private glService: GeneralLedgerService
    ) {}

    public async getInvoices(tenantId: number): Promise<any[]> {
        const query = `
            SELECT i.*, s.first_name || ' ' || s.last_name as student_name, inst.name as installment_name
            FROM accounting.fee_invoice i
            JOIN school.student s ON i.student_id = s.id
            LEFT JOIN accounting.fee_installment inst ON i.installment_id = inst.id
            WHERE i.tenant_id = $1 AND i.is_deleted = FALSE
            ORDER BY i.created_at DESC
        `;
        const res = await this.db.query(query, [tenantId]);
        return res.rows;
    }

    public async getInvoiceById(tenantId: number, id: number): Promise<any> {
        const query = `
            SELECT i.*, s.first_name || ' ' || s.last_name as student_name, inst.name as installment_name
            FROM accounting.fee_invoice i
            JOIN school.student s ON i.student_id = s.id
            LEFT JOIN accounting.fee_installment inst ON i.installment_id = inst.id
            WHERE i.tenant_id = $1 AND i.id = $2 AND i.is_deleted = FALSE
        `;
        const res = await this.db.query(query, [tenantId, id]);
        return res.rows[0];
    }

    /**
     * Raise invoices for all students for a specific installment.
     */
    public async batchGenerateInvoices(tenantId: number, installmentId: number): Promise<any> {
        const client = await this.db.connect();
        try {
            await client.query("BEGIN");

            // 1. Get Installment details
            const instRes = await client.query(
                `SELECT * FROM accounting.fee_installment WHERE id = $1 AND tenant_id = $2`,
                [installmentId, tenantId]
            );
            if (instRes.rows.length === 0) throw new Error("Installment not found");
            const installment = instRes.rows[0];

            // 2. Find students who need this installment but haven't been invoiced
            const studentsRes = await client.query(
                `SELECT s.id as student_id, s.first_name, s.last_name, se.classroom_id, se.academic_year_id
                 FROM school.student s
                 JOIN school.student_enrollment se ON s.id = se.student_id
                 WHERE s.tenant_id = $1 AND se.academic_year_id = $2 AND se.status = 'active'
                 AND NOT EXISTS (
                     SELECT 1 FROM accounting.fee_invoice fi 
                     WHERE fi.student_id = s.id AND fi.installment_id = $3 AND fi.is_deleted = FALSE
                 )`,
                [tenantId, installment.academic_year_id, installmentId]
            );

            console.log(`[FeeInvoiceService] Found ${studentsRes.rows.length} students to invoice for installment ${installmentId}`);

            const results = [];
            for (const row of studentsRes.rows) {
                // 3. Calculate Fee Amount
                const feeRes = await client.query(
                    `SELECT SUM(amount) as total FROM accounting.fee_structure
                     WHERE tenant_id = $1 AND academic_year_id = $2
                     AND (classroom_id = $3 OR classroom_id IS NULL)
                     AND is_deleted = FALSE`,
                    [tenantId, row.academic_year_id, row.classroom_id]
                );
                const totalAmount = parseFloat(feeRes.rows[0].total || "0");
                if (totalAmount <= 0) continue;

                // 4. Resolve Partner (Auto-create)
                const partner = await this.partnerHelper.getOrCreateFromStudent(tenantId, row.student_id, client);

                // 5. Create Generic Invoice
                const invoiceNo = await this.invoiceHelper.generateInvoiceNumber(tenantId);
                const genericInvoice = await this.genericInvoiceHelper.create(tenantId, {
                    partner_id: partner.id,
                    invoice_no: invoiceNo,
                    total_amount: totalAmount,
                    net_amount: totalAmount,
                    due_date: installment.due_date,
                    source_type: 'fee',
                    notes: `Fee: ${installment.name} for ${row.first_name} ${row.last_name}`
                }, client);

                // 6. Create Fee Invoice (Legacy Link)
                const feeInvoice = await this.invoiceHelper.createInvoice(tenantId, {
                    invoice_no: invoiceNo,
                    student_id: row.student_id,
                    academic_year_id: row.academic_year_id,
                    installment_id: installmentId,
                    total_amount: totalAmount,
                    discount_amount: 0,
                    tax_amount: 0,
                    net_amount: totalAmount,
                    due_date: installment.due_date
                }, client);

                results.push(feeInvoice);
            }

            await client.query("COMMIT");
            return { count: results.length, invoices: results };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Voids an invoice and reverses its ledger entries.
     */
    public async voidInvoice(tenantId: number, userId: number, invoiceId: number, reason: string) {
        const client = await this.db.connect();
        try {
            await client.query("BEGIN");

            // 1. Get invoice details
            const invoiceRes = await client.query(
                `SELECT * FROM accounting.fee_invoice WHERE id = $1 AND tenant_id = $2`,
                [invoiceId, tenantId]
            );
            if (invoiceRes.rows.length === 0) throw new Error("Invoice not found");
            const invoice = invoiceRes.rows[0];

            if (invoice.paid_amount > 0) {
                throw new Error("Cannot void an invoice that has existing payments. Reverse the payments first.");
            }

            // 2. Find and Reverse Journal Entry
            // Admission or automation invoices store invoice_id in metadata
            const journalRes = await client.query(
                `SELECT id FROM accounting.journal_entry 
                 WHERE tenant_id = $1 AND metadata->>'invoice_id' = $2`,
                [tenantId, invoiceId.toString()]
            );

            if (journalRes.rows.length > 0) {
                await this.glService.reverseJournal(tenantId, userId, journalRes.rows[0].id, reason);
            }

            // 3. Mark Invoice as Voided
            await client.query(
                `UPDATE accounting.fee_invoice 
                 SET status = 'voided', is_deleted = TRUE, updated_at = NOW() 
                 WHERE id = $1`,
                [invoiceId]
            );

            await client.query("COMMIT");
            return { success: true, message: "Invoice voided and journal reversed" };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}
