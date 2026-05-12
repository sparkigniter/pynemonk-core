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
        // Base query using a CTE to unify manual and fee-based invoices
        let query = `
            WITH all_invoices AS (
                -- 1. Manual/Generic Invoices
                SELECT 
                    i.id, i.tenant_id, i.invoice_no, i.total_amount, i.net_amount, i.paid_amount, i.due_amount, 
                    i.status, i.source_type, i.created_at, i.due_date,
                    p.name as partner_name, p.type as partner_type
                FROM accounting.invoice i
                JOIN accounting.partner p ON i.partner_id = p.id
                WHERE i.tenant_id = $1 AND i.is_deleted = FALSE

                UNION ALL

                -- 2. Fee Invoices (Joined with students as partners)
                SELECT 
                    fi.id, fi.tenant_id, fi.invoice_no, fi.total_amount, fi.net_amount, fi.paid_amount, fi.due_amount, 
                    fi.status, COALESCE(fi.source_type, 'fee') as source_type, fi.created_at, fi.due_date,
                    s.first_name || ' ' || s.last_name as partner_name, 'student' as partner_type
                FROM accounting.fee_invoice fi
                JOIN school.student s ON fi.student_id = s.id
                WHERE fi.tenant_id = $1 AND fi.is_deleted = FALSE
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
                -- Generic Invoices
                SELECT due_amount, paid_amount, due_date, status 
                FROM accounting.invoice 
                WHERE tenant_id = $1 AND is_deleted = FALSE
                UNION ALL
                -- Fee Invoices
                SELECT due_amount, paid_amount, due_date, status 
                FROM accounting.fee_invoice 
                WHERE tenant_id = $1 AND is_deleted = FALSE
            )
            SELECT 
                COALESCE(SUM(due_amount), 0) as total_outstanding,
                COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE AND status != 'paid' THEN due_amount ELSE 0 END), 0) as overdue_amount,
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
