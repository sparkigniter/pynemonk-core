import { inject, injectable } from "tsyringe";
import { Pool, PoolClient } from "pg";

export interface JournalLineDTO {
    account_id: number;
    debit: number;
    credit: number;
    partner_id?: number;
    partner_type?: 'student' | 'vendor' | 'employee';
    school_id?: number;
    grade_id?: number;
    department_id?: number;
    cost_center_id?: number;
}

export interface JournalEntryDTO {
    entry_date: Date;
    reference_no: string;
    description: string;
    transaction_type: string;
    metadata?: any;
    items: JournalLineDTO[];
}

@injectable()
export default class GeneralLedgerService {
    constructor(@inject("DB") private db: Pool) {}

    /**
     * The primary entry point for posting any financial transaction.
     * Enforces:
     * 1. Total Debits == Total Credits (Double-Entry Balance)
     * 2. ACID Transaction safety
     * 3. Immutable audit logs
     */
    public async postJournal(tenantId: number, userId: number, entry: JournalEntryDTO, externalClient?: PoolClient): Promise<number> {
        // 1. Double-Entry Validation
        const totalDebit = entry.items.reduce((sum, item) => sum + Number(item.debit || 0), 0);
        const totalCredit = entry.items.reduce((sum, item) => sum + Number(item.credit || 0), 0);

        // Allow for small floating point differences in edge cases, but generally strict
        if (Math.abs(totalDebit - totalCredit) > 0.001) {
            throw new Error(`Unbalanced Journal Entry: Total Debit (${totalDebit}) does not equal Total Credit (${totalCredit}).`);
        }

        if (totalDebit === 0 && totalCredit === 0) {
            throw new Error("Zero-value journal entries are not allowed.");
        }

        const client = externalClient || await this.db.connect();
        
        try {
            if (!externalClient) await client.query('BEGIN');

            // 2. Create the Header (journal_entry)
            const headerRes = await client.query(
                `INSERT INTO accounting.journal_entry 
                    (tenant_id, entry_date, reference_no, description, transaction_type, status, created_by, metadata)
                 VALUES ($1, $2, $3, $4, $5, 'posted', $6, $7)
                 RETURNING id`,
                [
                    tenantId, 
                    entry.entry_date, 
                    entry.reference_no, 
                    entry.description, 
                    entry.transaction_type, 
                    userId,
                    entry.metadata ? JSON.stringify(entry.metadata) : null
                ]
            );

            const journalId = headerRes.rows[0].id;

            // 3. Create the Lines (journal_item)
            for (const item of entry.items) {
                await client.query(
                    `INSERT INTO accounting.journal_item 
                        (tenant_id, journal_entry_id, account_id, debit, credit, partner_id, partner_type, school_id, grade_id, department_id, cost_center_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        tenantId,
                        journalId,
                        item.account_id,
                        item.debit,
                        item.credit,
                        item.partner_id,
                        item.partner_type,
                        item.school_id,
                        item.grade_id,
                        item.department_id,
                        item.cost_center_id
                    ]
                );

            }

            if (!externalClient) await client.query('COMMIT');
            return journalId;
        } catch (err) {
            if (!externalClient) await client.query('ROLLBACK');
            throw err;
        } finally {
            if (!externalClient) client.release();
        }
    }

    /**
     * Reverses an existing journal entry.
     * Enforces the immutable nature of financial logs.
     */
    public async reverseJournal(tenantId: number, userId: number, originalJournalId: number, reason: string): Promise<number> {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // Fetch original entry
            const originalRes = await client.query(
                `SELECT * FROM accounting.journal_entry WHERE id = $1 AND tenant_id = $2`,
                [originalJournalId, tenantId]
            );

            if (originalRes.rows.length === 0) throw new Error("Original journal entry not found.");
            const original = originalRes.rows[0];

            if (original.status === 'voided') throw new Error("Journal entry is already voided.");

            // Fetch original items
            const itemsRes = await client.query(
                `SELECT * FROM accounting.journal_item WHERE journal_entry_id = $1`,
                [originalJournalId]
            );

            // Create reversal entry
            const reversalEntry: JournalEntryDTO = {
                entry_date: new Date(),
                reference_no: `REV-${original.reference_no}`,
                description: `Reversal of ${original.reference_no}: ${reason}`,
                transaction_type: 'reversal',
                metadata: { original_journal_id: originalJournalId },
                items: itemsRes.rows.map(item => ({
                    account_id: item.account_id,
                    debit: item.credit, // Swap debit/credit
                    credit: item.debit,
                    partner_id: item.partner_id,
                    partner_type: item.partner_type,
                    school_id: item.school_id,
                    grade_id: item.grade_id
                }))
            };

            const reversalId = await this.postJournal(tenantId, userId, reversalEntry, client);

            // Mark original as voided
            await client.query(
                `UPDATE accounting.journal_entry SET status = 'voided', updated_at = NOW() WHERE id = $1`,
                [originalJournalId]
            );

            await client.query('COMMIT');
            return reversalId;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}
