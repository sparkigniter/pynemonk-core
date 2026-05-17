import { inject, injectable } from "tsyringe";
import { Pool } from "pg";
import JournalHelper from "./JournalHelper.js";

@injectable()
export default class BankingHelper {
    constructor(
        @inject("DB") private db: Pool,
        @inject(JournalHelper) private journalHelper: JournalHelper
    ) {}

    public async listAccounts(tenantId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT b.*, a.name as gl_account_name, a.code as gl_account_code,
             COALESCE((SELECT SUM(debit) - SUM(credit) FROM accounting.journal_item WHERE account_id = b.gl_account_id AND tenant_id = $1), 0) as balance
             FROM accounting.bank_account b
             LEFT JOIN accounting.chart_of_accounts a ON b.gl_account_id = a.id
             WHERE b.tenant_id = $1 AND b.is_deleted = FALSE
             ORDER BY b.name`,
            [tenantId]
        );
        return res.rows;
    }

    public async createAccount(tenantId: number, data: any): Promise<any> {
        const res = await this.db.query(
            `INSERT INTO accounting.bank_account 
                (tenant_id, name, bank_name, account_no, branch, gl_account_id, opening_balance)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                tenantId, data.name, data.bank_name, data.account_no, 
                data.branch, data.gl_account_id, data.opening_balance || 0
            ]
        );
        return res.rows[0];
    }

    public async listPendingTransactions(tenantId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT * FROM accounting.bank_transaction 
             WHERE tenant_id = $1 AND is_reconciled = FALSE
             ORDER BY transaction_date DESC`,
            [tenantId]
        );
        return res.rows;
    }

    public async getTreasuryInventory(tenantId: number): Promise<any[]> {
        const query = `
            SELECT 
                a.id as gl_account_id,
                a.name,
                a.code,
                t.name as type_name,
                COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) as balance,
                CASE 
                    WHEN a.name ILIKE '%bank%' THEN 'bank'
                    WHEN a.name ILIKE '%cash%' THEN 'cash'
                    WHEN a.name ILIKE '%upi%' THEN 'upi'
                    ELSE 'other_liquid'
                END as treasury_type
            FROM accounting.chart_of_accounts a
            JOIN accounting.account_type t ON a.account_type_id = t.id
            LEFT JOIN accounting.journal_item ji ON a.id = ji.account_id AND ji.tenant_id = a.tenant_id
            WHERE a.tenant_id = $1 
              AND a.is_deleted = FALSE
              AND (
                a.name ILIKE '%bank%' 
                OR a.name ILIKE '%cash%' 
                OR a.name ILIKE '%upi%'
                OR (t.name = 'Asset' AND a.code LIKE '11%')
              )
            GROUP BY a.id, a.name, a.code, t.name
            ORDER BY treasury_type ASC, a.code ASC
        `;
        const res = await this.db.query(query, [tenantId]);
        return res.rows;
    }

    public async settleFunds(tenantId: number, userId: number, data: { sourceAccountId: number, targetAccountId: number, amount: number, description?: string }): Promise<any> {
        const { sourceAccountId, targetAccountId, amount, description } = data;

        const journalInput = {
            entry_date: new Date(),
            reference_no: `SETTLE-${Date.now()}`,
            description: description || `Institutional Treasury Settlement: Sweep to Bank`,
            transaction_type: 'treasury_settlement',
            items: [
                {
                    account_id: targetAccountId,
                    debit: amount,
                    credit: 0,
                    description: `Debit: Targeted Bank Deposit`
                },
                {
                    account_id: sourceAccountId,
                    debit: 0,
                    credit: amount,
                    description: `Credit: Source Liquidity Sweep`
                }
            ]
        };

        return await this.journalHelper.createEntry(tenantId, userId, journalInput);
    }
}
