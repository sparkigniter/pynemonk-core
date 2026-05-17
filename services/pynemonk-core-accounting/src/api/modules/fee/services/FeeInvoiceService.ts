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

    public async getInvoiceById(tenantId: number, id: string | number): Promise<any> {
        let invoiceId: number | null = null;
        let prefix = '';

        if (typeof id === 'string' && id.includes('-')) {
            const parts = id.split('-');
            prefix = parts[0];
            invoiceId = parseInt(parts[1], 10);
        } else if (typeof id === 'number') {
            invoiceId = id;
        } else if (typeof id === 'string') {
            invoiceId = parseInt(id, 10);
        }

        if (!invoiceId || isNaN(invoiceId)) {
            console.warn(`[FeeInvoiceService] Invalid invoice ID received: ${id}`);
            return null;
        }

        let invoice: any = null;

        // 1. Unified Generic/Formal Invoice (New System)
        if (prefix === 'GEN' || prefix === 'INV' || !prefix) {
            const genericQuery = `
                SELECT i.*, p.name as partner_name, p.type as partner_type,
                (SELECT json_agg(il) FROM (SELECT description, quantity, unit_price as amount FROM accounting.invoice_line WHERE invoice_id = i.id) il) as items
                FROM accounting.invoice i
                JOIN accounting.partner p ON i.partner_id = p.id
                WHERE i.tenant_id = $1 AND i.id = $2 AND i.is_deleted = FALSE
            `;
            const gRes = await this.db.query(genericQuery, [tenantId, invoiceId]);
            invoice = gRes.rows[0];
        }

        // 2. Legacy Fee Invoice
        if (!invoice && (prefix === 'FEE' || !prefix)) {
            const feeQuery = `
                SELECT i.*, s.first_name || ' ' || s.last_name as student_name, 'fee' as source_type
                FROM accounting.fee_invoice i
                JOIN school.student s ON i.student_id = s.id
                WHERE i.tenant_id = $1 AND i.id = $2 AND i.is_deleted = FALSE
            `;
            const fRes = await this.db.query(feeQuery, [tenantId, invoiceId]);
            invoice = fRes.rows[0];
            if (invoice) {
                invoice.partner_name = invoice.student_name;
                invoice.partner_type = 'student';
            }
        }

        // 3. Virtual Allocation Invoice (Grouped)
        if (!invoice && (prefix === 'ALLOC' || !prefix)) {
            const virtualQuery = `
                SELECT 
                    sfa.id, sfa.tenant_id, 'ALLOC-' || sfa.id as invoice_no, 
                    SUM(fi.amount_due) as total_amount, SUM(fi.amount_due) as net_amount, 
                    SUM(fi.amount_paid) as paid_amount, SUM(fi.amount_due - fi.amount_paid) as due_amount,
                    sfa.student_id, s.first_name || ' ' || s.last_name as student_name,
                    MIN(fi.due_date) as due_date, 'fee_allocation' as source_type, MIN(fi.created_at) as created_at, sfa.id as allocation_id
                FROM school.fee_installment fi
                JOIN school.student_fee_allocation sfa ON fi.allocation_id = sfa.id
                JOIN school.student s ON sfa.student_id = s.id
                WHERE sfa.tenant_id = $1 AND sfa.id = $2
                GROUP BY sfa.tenant_id, sfa.id, s.first_name, s.last_name
            `;
            const vRes = await this.db.query(virtualQuery, [tenantId, invoiceId]);
            invoice = vRes.rows[0];
            if (invoice) {
                invoice.partner_name = invoice.student_name;
                invoice.partner_type = 'student';
            }
        }

        if (invoice) {
            // 4. Fetch Line Items
            let allocationId = invoice.allocation_id;

            // If it's a migrated fee invoice, an ALLOC virtual invoice, or a fee_group
            if (!allocationId && (invoice.source_type === 'fee' || invoice.source_type === 'fee_allocation' || invoice.source_type === 'fee_group')) {
                // If it's a formal fee invoice, source_id points to the allocation_id or installment_id
                const refId = invoice.source_id;
                if (refId) {
                    if (invoice.source_type === 'fee_group') {
                        allocationId = refId;
                    } else {
                        // Find the allocation_id from the installment
                        const allocLookup = await this.db.query(`SELECT allocation_id FROM school.fee_installment WHERE id = $1`, [refId]);
                        allocationId = allocLookup.rows[0]?.allocation_id;
                    }
                }
            }

            if (allocationId) {
                // If this is a specific invoice (not a virtual group), filter items by this invoice_id
                let itemQuery = "";
                let params = [];

                if (invoice.id && invoice.source_type !== 'fee_allocation' && prefix !== 'ALLOC') {
                    itemQuery = `
                        SELECT fh.name as description, fi.amount_due as amount, 1 as quantity
                        FROM school.fee_installment fi
                        JOIN school.fee_structure_item fsi ON fi.fee_structure_item_id = fsi.id
                        JOIN school.fee_head fh ON fsi.fee_head_id = fh.id
                        WHERE fi.allocation_id = $1 AND fi.invoice_id = $2
                    `;
                    params = [allocationId, invoice.id];
                } else {
                    itemQuery = `
                        SELECT fh.name as description, fi.amount_due as amount, 1 as quantity
                        FROM school.fee_installment fi
                        JOIN school.fee_structure_item fsi ON fi.fee_structure_item_id = fsi.id
                        JOIN school.fee_head fh ON fsi.fee_head_id = fh.id
                        WHERE fi.allocation_id = $1
                    `;
                    params = [allocationId];
                }

                const itemRes = await this.db.query(itemQuery, params);
                invoice.items = itemRes.rows;
                
                // Recalculate totals to match the items if they are derived from school installments
                // This ensures "Total Receivable" matches the "Billable Items" shown
                if (invoice.items && invoice.items.length > 0) {
                    const calculatedTotal = invoice.items.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0);
                    
                    // Only override if there is a mismatch or it's a virtual invoice
                    if (invoice.source_type === 'fee_allocation' || invoice.source_type === 'fee' || Math.abs(parseFloat(invoice.net_amount) - calculatedTotal) > 0.01) {
                        invoice.total_amount = calculatedTotal;
                        invoice.net_amount = calculatedTotal;
                        
                        // For fee_allocation, we also need to fetch total paid
                        if (invoice.source_type === 'fee_allocation') {
                            const paidRes = await this.db.query(`SELECT SUM(amount_paid) as total_paid FROM school.fee_installment WHERE allocation_id = $1`, [allocationId]);
                            invoice.paid_amount = parseFloat(paidRes.rows[0].total_paid || '0');
                        }
                        invoice.due_amount = invoice.total_amount - (invoice.paid_amount || 0);
                    }
                }
            } else if (!invoice.items || invoice.items.length === 0) {
                // Fallback: Create a single virtual item for generic invoices
                invoice.items = [{
                    description: invoice.notes || `Invoice ${invoice.invoice_no}`,
                    amount: invoice.net_amount,
                    quantity: 1
                }];
            }
        }

        return invoice;
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
                // 3. Calculate Fee Amount (Try student allocation first)
                const allocRes = await client.query(
                    `SELECT SUM(fi.amount_due) as total 
                     FROM school.fee_installment fi
                     JOIN school.student_fee_allocation sfa ON fi.allocation_id = sfa.id
                     JOIN school.fee_structure_item fsi ON fi.fee_structure_item_id = fsi.id
                     WHERE sfa.student_id = $1 AND sfa.tenant_id = $2 
                     AND sfa.academic_year_id = $3 AND fsi.installment_name = $4`,
                    [row.student_id, tenantId, row.academic_year_id, installment.name]
                );
                
                let totalAmount = parseFloat(allocRes.rows[0]?.total || "0");
                let sourceSystem = 'allocation';

                if (totalAmount <= 0) {
                    // Fallback: Legacy Fee Structure
                    const feeRes = await client.query(
                        `SELECT SUM(amount) as total FROM accounting.fee_structure
                         WHERE tenant_id = $1 AND academic_year_id = $2
                         AND (classroom_id = $3 OR classroom_id IS NULL)
                         AND is_deleted = FALSE`,
                        [tenantId, row.academic_year_id, row.classroom_id]
                    );
                    totalAmount = parseFloat(feeRes.rows[0].total || "0");
                    sourceSystem = 'legacy';
                }

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
                    source_type: sourceSystem === 'allocation' ? 'fee_allocation' : 'fee',
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

                // 7. Link Back to School Installments
                if (sourceSystem === 'allocation') {
                    await client.query(
                        `UPDATE school.fee_installment fi
                         SET invoice_id = $1
                         FROM school.student_fee_allocation sfa
                         JOIN school.fee_structure_item fsi ON fi.fee_structure_item_id = fsi.id
                         WHERE fi.allocation_id = sfa.id 
                         AND sfa.student_id = $2 AND sfa.tenant_id = $3
                         AND fsi.installment_name = $4`,
                        [feeInvoice.id, row.student_id, tenantId, installment.name]
                    );
                }

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
