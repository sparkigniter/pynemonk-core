import { inject, injectable } from "tsyringe";
import { Pool } from "pg";
import JournalHelper from "./JournalHelper.js";

@injectable()
export default class SystemMappingHelper {
    constructor(
        @inject("DB") private db: Pool,
        @inject(JournalHelper) private journalHelper: JournalHelper
    ) {}

    public async getMappedAccount(tenantId: number, key: string): Promise<number | null> {
        const res = await this.db.query(
            `SELECT account_id FROM accounting.system_account_mapping 
             WHERE tenant_id = $1 AND mapping_key = $2`,
            [tenantId, key]
        );
        return res.rows[0]?.account_id || null;
    }

    public async setMapping(tenantId: number, key: string, accountId: number): Promise<void> {
        await this.db.query(
            `INSERT INTO accounting.system_account_mapping (tenant_id, mapping_key, account_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (tenant_id, mapping_key) DO UPDATE SET account_id = EXCLUDED.account_id`,
            [tenantId, key, accountId]
        );
    }

    /**
     * Automatically posts a journal entry based on a system event.
     */
    public async postAutomatedTransaction(tenantId: number, userId: number, event: {
        type: 'ADMISSION' | 'SALARY_PAYMENT' | 'FEE_COLLECTION';
        amount: number;
        reference: string;
        description: string;
    }): Promise<any> {
        let debitAccountId: number | null = null;
        let creditAccountId: number | null = null;

        switch (event.type) {
            case 'ADMISSION':
                debitAccountId = await this.getMappedAccount(tenantId, 'FEE_COLLECTION_DEBIT');
                creditAccountId = await this.getMappedAccount(tenantId, 'INVOICE_REVENUE');
                break;
            case 'SALARY_PAYMENT':
                debitAccountId = await this.getMappedAccount(tenantId, 'SALARY_EXPENSE');
                creditAccountId = await this.getMappedAccount(tenantId, 'BANK_BALANCE');
                break;
            case 'FEE_COLLECTION':
                debitAccountId = await this.getMappedAccount(tenantId, 'FEE_COLLECTION_DEBIT');
                creditAccountId = await this.getMappedAccount(tenantId, 'FEE_COLLECTION_CREDIT');
                break;
        }

        if (!debitAccountId || !creditAccountId) {
            throw new Error(`System account mapping missing for event type: ${event.type}. Please configure default accounts in Accounting Settings.`);
        }

        return this.journalHelper.createEntry(tenantId, userId, {
            entry_date: new Date(),
            reference_no: event.reference,
            description: event.description,
            items: [
                { account_id: debitAccountId, debit: event.amount, credit: 0 },
                { account_id: creditAccountId, debit: 0, credit: event.amount }
            ]
        });
    }

    public async getMappings(tenantId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT m.*, a.name as account_name, a.code as account_code 
             FROM accounting.system_account_mapping m
             LEFT JOIN accounting.chart_of_accounts a ON m.account_id = a.id
             WHERE m.tenant_id = $1
             ORDER BY m.category, m.label`,
            [tenantId]
        );
        return res.rows;
    }

    public async getMappingsByCategory(tenantId: number, category: string): Promise<any[]> {
        const res = await this.db.query(
            `SELECT m.*, a.name as account_name, a.code as account_code 
             FROM accounting.system_account_mapping m
             LEFT JOIN accounting.chart_of_accounts a ON m.account_id = a.id
             WHERE m.tenant_id = $1 AND m.category = $2`,
            [tenantId, category]
        );
        return res.rows;
    }
}
