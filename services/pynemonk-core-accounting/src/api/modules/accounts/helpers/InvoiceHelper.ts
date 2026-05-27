import { inject, injectable } from "tsyringe";
import { Pool } from "pg";
import JournalHelper from "./JournalHelper.js";
import SystemMappingHelper from "./SystemMappingHelper.js";

@injectable()
export default class InvoiceHelper {
    constructor(
        @inject("DB") private db: Pool,
        private journalHelper: JournalHelper,
        private systemMappingHelper: SystemMappingHelper
    ) {}

    public async list(tenantId: number, options: any = {}): Promise<any[]> {
        // Base query using a CTE to unify formal invoices and uninvoiced installments
        let query = `
            WITH all_invoices AS (
                -- 1. Formal Invoices (Unified Generic + Migrated Fees)
                SELECT 
                    'GEN-' || i.id as id, i.tenant_id, i.invoice_no, i.total_amount, i.net_amount, i.paid_amount, i.due_amount, 
                    i.status, i.source_type, i.created_at, i.due_date,
                    p.name as partner_name, p.type as partner_type,
                    CASE WHEN p.external_ref_type = 'student' THEN p.external_ref_id ELSE NULL END as student_id
                FROM accounting.invoice i
                JOIN accounting.partner p ON i.partner_id = p.id
                WHERE i.tenant_id = $1 AND i.is_deleted = FALSE

                UNION ALL

                -- 2. Uninvoiced Fee Installments (Grouped by Allocation)
                -- These represent 'Recognized' but not yet formally 'Invoiced' receivables
                SELECT 
                    'ALLOC-' || sfa.id as id, sfa.tenant_id, 'ALLOC-' || sfa.id as invoice_no, 
                    SUM(fi.amount_due) as total_amount, SUM(fi.amount_due) as net_amount, 
                    SUM(fi.amount_paid) as paid_amount, SUM(fi.amount_due - fi.amount_paid) as due_amount,
                    CASE 
                        WHEN SUM(fi.amount_due - fi.amount_paid) <= 0 THEN 'paid'
                        WHEN SUM(fi.amount_paid) > 0 THEN 'partial'
                        ELSE 'unpaid'
                    END as status,
                    'fee_allocation' as source_type, MIN(fi.created_at) as created_at, MIN(fi.due_date) as due_date,
                    s.first_name || ' ' || s.last_name as partner_name, 'student' as partner_type,
                    sfa.student_id as student_id
                FROM school.fee_installment fi
                JOIN school.student_fee_allocation sfa ON fi.allocation_id = sfa.id
                JOIN school.student s ON sfa.student_id = s.id
                WHERE sfa.tenant_id = $1 AND fi.invoice_id IS NULL
                GROUP BY sfa.id, sfa.tenant_id, s.first_name, s.last_name, sfa.student_id
            )
            SELECT * FROM all_invoices WHERE 1=1
        `;
        const params: any[] = [tenantId];

        if (options.status) {
            params.push(options.status);
            query += ` AND status = $${params.length}`;
        }

        if (options.search) {
            params.push(`%${options.search}%`);
            query += ` AND (invoice_no ILIKE $${params.length} OR partner_name ILIKE $${params.length})`;
        }

        if (options.studentId) {
            params.push(options.studentId);
            query += ` AND student_id = $${params.length}`;
        }

        query += ` ORDER BY created_at DESC`;
        const res = await this.db.query(query, params);
        return res.rows;
    }

    public async create(tenantId: number, data: any, client: Pool | any = this.db): Promise<any> {
        const res = await client.query(
            `INSERT INTO accounting.invoice 
                (tenant_id, partner_id, invoice_no, invoice_date, due_date, total_amount, 
                 tax_amount, discount_amount, net_amount, due_amount, status, source_type, source_id, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING *`,
            [
                tenantId, data.partner_id, data.invoice_no, data.invoice_date || new Date(), 
                data.due_date, data.total_amount, data.tax_amount || 0, data.discount_amount || 0,
                data.net_amount, data.due_amount ?? data.net_amount, 
                data.status || 'unpaid', data.source_type, data.source_id, data.notes
            ]
        );
        return res.rows[0];
    }

    /**
     * Creates a manual generic invoice and its associated accounting journal entry.
     */
    public async createGenericInvoiceWithJournal(tenantId: number, userId: number, data: any): Promise<any> {
        const client = await this.db.connect();
        try {
            await client.query("BEGIN");

            // 1. Create Invoice Record
            const invoice = await this.create(tenantId, {
                ...data,
                source_type: 'manual'
            }, client);

            // 2. Resolve Accounts
            const arAccount = await this.systemMappingHelper.getMappedAccount(tenantId, 'ASSET_RECEIVABLE');
            const revAccount = await this.systemMappingHelper.getMappedAccount(tenantId, 'REV_GENERAL');

            if (!arAccount || !revAccount) {
                throw new Error("Generic Revenue or Receivable account mapping missing in Accounting Settings.");
            }

            // 3. Create Journal Entry
            await this.journalHelper.createEntry(tenantId, userId, {
                entry_date: data.invoice_date || new Date(),
                reference_no: data.invoice_no,
                description: data.notes || `Invoice ${data.invoice_no}`,
                transaction_type: 'ar_invoice',
                items: [
                    { 
                        account_id: arAccount, 
                        debit: data.net_amount, 
                        partner_id: data.partner_id, 
                        partner_type: 'customer' 
                    },
                    { 
                        account_id: revAccount, 
                        credit: data.net_amount 
                    }
                ]
            }, client);

            await client.query("COMMIT");
            return invoice;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    public async getSummary(tenantId: number): Promise<any> {
        const query = `
            WITH all_receivables AS (
                -- 1. Generic/Manual Invoices
                SELECT due_amount, paid_amount, due_date, status 
                FROM accounting.invoice 
                WHERE tenant_id = $1 AND is_deleted = FALSE
                
                UNION ALL
                
                -- 2. Fee Invoices (Raised)
                SELECT due_amount, paid_amount, due_date, status 
                FROM accounting.fee_invoice 
                WHERE tenant_id = $1 AND is_deleted = FALSE

                UNION ALL

                -- 3. Uninvoiced Fee Installments (Allocated but not yet raised as accounting invoices)
                -- This ensures that 'Allocation' immediately reflects in AR
                SELECT 
                    (amount_due - amount_paid) as due_amount, 
                    amount_paid, 
                    due_date, 
                    fi.status
                FROM school.fee_installment fi
                JOIN school.student_fee_allocation sfa ON fi.allocation_id = sfa.id
                WHERE sfa.tenant_id = $1 AND fi.invoice_id IS NULL
            )
            SELECT 
                COALESCE(SUM(due_amount), 0) as total_outstanding,
                COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE AND LOWER(status) NOT IN ('paid', 'settled') THEN due_amount ELSE 0 END), 0) as overdue_amount,
                COALESCE(SUM(paid_amount), 0) as total_collected,
                COUNT(*) as invoice_count
            FROM all_receivables
        `;
        const res = await this.db.query(query, [tenantId]);
        return res.rows[0];
    }


    public async generateInvoiceNumber(tenantId: number): Promise<string> {
        const res = await this.db.query(
            `SELECT COUNT(*) as count FROM accounting.invoice WHERE tenant_id = $1`,
            [tenantId]
        );
        const count = parseInt(res.rows[0].count) + 1;
        return `INV-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;
    }
}
