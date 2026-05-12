import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class BankingHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async listAccounts(tenantId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT b.*, a.name as gl_account_name, a.code as gl_account_code,
             COALESCE((SELECT SUM(debit) - SUM(credit) FROM accounting.journal_item WHERE account_id = b.gl_account_id), 0) as balance
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
}
