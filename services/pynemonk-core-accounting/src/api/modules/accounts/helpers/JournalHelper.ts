import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

export interface JournalItemInput {
    account_id: number;
    debit?: number;
    credit?: number;
    description?: string;
    partner_type?: string;
    partner_id?: number;
    school_id?: number;
    grade_id?: number;
    department_id?: number;
    cost_center_id?: number;
}

export interface JournalEntryInput {
    entry_date?: Date;
    reference_no?: string;
    description?: string;
    transaction_type?: string;
    items: JournalItemInput[];
}

@injectable()
export default class JournalHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async createEntry(tenantId: number, userId: number, data: JournalEntryInput, db: Pool | any = this.db): Promise<any> {
        // 1. Validate balance
        const totalDebit = data.items.reduce((sum, item) => sum + (item.debit || 0), 0);
        const totalCredit = data.items.reduce((sum, item) => sum + (item.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.001) {
            throw new Error(`Journal entry is not balanced. Total Debit: ${totalDebit}, Total Credit: ${totalCredit}`);
        }

        // 2. Create Header
        const headerRes = await db.query(
            `INSERT INTO accounting.journal_entry
                (tenant_id, entry_date, reference_no, description, transaction_type, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                tenantId,
                data.entry_date || new Date(),
                data.reference_no,
                data.description,
                data.transaction_type || 'manual',
                userId
            ]
        );
        const entryId = headerRes.rows[0].id;

        // 3. Create Items
        for (const item of data.items) {
            await db.query(
                `INSERT INTO accounting.journal_item
                    (tenant_id, journal_entry_id, account_id, debit, credit, description, partner_type, partner_id, school_id, grade_id, department_id, cost_center_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    tenantId,
                    entryId,
                    item.account_id,
                    item.debit || 0,
                    item.credit || 0,
                    item.description || data.description,
                    item.partner_type,
                    item.partner_id,
                    item.school_id,
                    item.grade_id,
                    item.department_id,
                    item.cost_center_id
                ]
            );
        }

        return headerRes.rows[0];
    }

    public async getEntries(tenantId: number, filters: any = {}): Promise<any[]> {
        const res = await this.db.query(
            `SELECT je.*, 
                    (SELECT json_agg(ji.*) FROM accounting.journal_item ji WHERE ji.journal_entry_id = je.id) as items
             FROM accounting.journal_entry je
             WHERE je.tenant_id = $1 AND je.is_deleted = FALSE
             ORDER BY je.entry_date DESC, je.id DESC
             LIMIT 50`,
            [tenantId]
        );
        return res.rows;
    }
}
