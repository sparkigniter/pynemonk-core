import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class VendorHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async list(tenantId: number, search?: string): Promise<any[]> {
        let query = `SELECT * FROM accounting.vendor WHERE tenant_id = $1 AND is_deleted = FALSE`;
        const params: any[] = [tenantId];

        if (search) {
            query += ` AND (name ILIKE $2 OR code ILIKE $2)`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY name`;
        const res = await this.db.query(query, params);
        return res.rows;
    }

    public async create(tenantId: number, data: any): Promise<any> {
        const res = await this.db.query(
            `INSERT INTO accounting.vendor 
                (tenant_id, name, code, contact_person, email, phone, address, opening_balance)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                tenantId, data.name, data.code, data.contact_person, 
                data.email, data.phone, data.address, data.opening_balance || 0
            ]
        );
        return res.rows[0];
    }

    public async createBill(tenantId: number, data: any): Promise<any> {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            
            // 0. Resolve Accounts Payable account for this tenant
            const apAccRes = await client.query(
                `SELECT id FROM accounting.chart_of_accounts 
                 WHERE tenant_id = $1 AND code = '2100' LIMIT 1`,
                [tenantId]
            );
            const apAccountId = apAccRes.rows[0]?.id;
            if (!apAccountId) throw new Error("Accounts Payable account (2100) not found for this tenant");

            // 1. Create Journal Entry
            const jeRes = await client.query(
                `INSERT INTO accounting.journal_entry (tenant_id, entry_date, reference_no, description)
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [tenantId, data.bill_date, data.bill_no, `Bill ${data.bill_no}: ${data.notes || ''}`]
            );
            const jeId = jeRes.rows[0].id;

            // 2. Create Journal Items
            // Debit each item's account
            for (const item of data.items) {
                await client.query(
                    `INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, description)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [tenantId, jeId, item.account_id, item.amount, item.description]
                );
            }

            // Credit Accounts Payable for total
            await client.query(
                `INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, credit, description)
                 VALUES ($1, $2, $3, $4, $5)`,
                [tenantId, jeId, apAccountId, data.total_amount, `Total Payable for Bill ${data.bill_no}`]
            );

            // 3. Create Vendor Bill record
            const billRes = await client.query(
                `INSERT INTO accounting.vendor_bill 
                    (tenant_id, vendor_id, bill_no, bill_date, due_date, total_amount, journal_entry_id, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [tenantId, data.vendor_id, data.bill_no, data.bill_date, data.due_date, data.total_amount, jeId, data.notes]
            );

            await client.query('COMMIT');
            return billRes.rows[0];
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    public async recordPayment(tenantId: number, data: any): Promise<any> {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // 0. Resolve Bank's GL Account
            const bankRes = await client.query(
                `SELECT gl_account_id FROM accounting.bank_account WHERE id = $1 AND tenant_id = $2`,
                [data.bank_account_id, tenantId]
            );
            const bankGlAccountId = bankRes.rows[0]?.gl_account_id;
            if (!bankGlAccountId) throw new Error("Bank account GL mapping not found");

            // Resolve AP Account
            const apAccRes = await client.query(
                `SELECT id FROM accounting.chart_of_accounts WHERE tenant_id = $1 AND code = '2100' LIMIT 1`,
                [tenantId]
            );
            const apAccountId = apAccRes.rows[0]?.id;

            // 1. Create Journal Entry (Debit AP, Credit Bank)
            const jeRes = await client.query(
                `INSERT INTO accounting.journal_entry (tenant_id, entry_date, reference_no, description)
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [tenantId, data.payment_date || new Date(), data.reference_no, `Bill Payment: ${data.notes || ''}`]
            );
            const jeId = jeRes.rows[0].id;

            await client.query(
                `INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, description)
                 VALUES ($1, $2, $3, $4, $5)`,
                [tenantId, jeId, apAccountId, data.total_amount, `Debit AP for Bill Payment`]
            );

            await client.query(
                `INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, credit, description)
                 VALUES ($1, $2, $3, $4, $5)`,
                [tenantId, jeId, bankGlAccountId, data.total_amount, `Credit Bank for Bill Payment`]
            );

            // 2. Create Payment Record
            const payRes = await client.query(
                `INSERT INTO accounting.bill_payment 
                    (tenant_id, vendor_id, payment_date, amount, bank_account_id, payment_method, reference_no, journal_entry_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [tenantId, data.vendor_id, data.payment_date || new Date(), data.total_amount, data.bank_account_id, data.payment_method, data.reference_no, jeId]
            );
            const paymentId = payRes.rows[0].id;

            // 3. Process Allocations
            for (const alloc of data.allocations) {
                // Link payment to bill
                await client.query(
                    `INSERT INTO accounting.bill_payment_allocation (tenant_id, payment_id, bill_id, amount)
                     VALUES ($1, $2, $3, $4)`,
                    [tenantId, paymentId, alloc.bill_id, alloc.amount]
                );

                // Update bill status and paid amount
                await client.query(
                    `UPDATE accounting.vendor_bill 
                     SET paid_amount = paid_amount + $1,
                         status = CASE 
                            WHEN (paid_amount + $1) >= total_amount THEN 'paid'
                            ELSE 'partial'
                         END
                     WHERE id = $2`,
                    [alloc.amount, alloc.bill_id]
                );
            }

            await client.query('COMMIT');
            return payRes.rows[0];
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    public async getBills(tenantId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT b.*, v.name as vendor_name 
             FROM accounting.vendor_bill b
             JOIN accounting.vendor v ON b.vendor_id = v.id
             WHERE b.tenant_id = $1 AND b.is_deleted = FALSE
             ORDER BY b.bill_date DESC`,
            [tenantId]
        );
        return res.rows;
    }

    public async getPayments(tenantId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT p.*, v.name as vendor_name, b.bank_name as bank_name
             FROM accounting.bill_payment p
             JOIN accounting.vendor v ON p.vendor_id = v.id
             LEFT JOIN accounting.bank_account b ON p.bank_account_id = b.id
             WHERE p.tenant_id = $1 AND p.is_deleted = FALSE
             ORDER BY p.payment_date DESC, p.created_at DESC`,
            [tenantId]
        );
        return res.rows;
    }
}
