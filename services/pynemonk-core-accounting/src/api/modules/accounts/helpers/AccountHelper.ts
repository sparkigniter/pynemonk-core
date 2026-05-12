import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class AccountHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async createAccount(tenantId: number, data: {
        code: string;
        name: string;
        account_type_id: number;
        parent_id?: number;
        is_group?: boolean;
    }, db: Pool | any = this.db): Promise<any> {
        const res = await db.query(
            `INSERT INTO accounting.chart_of_accounts
                (tenant_id, code, name, account_type_id, parent_id, is_group)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                tenantId,
                data.code,
                data.name,
                data.account_type_id,
                data.parent_id || null,
                data.is_group || false
            ]
        );
        return res.rows[0];
    }

    public async getChartOfAccounts(tenantId: number, search?: string): Promise<any[]> {
        let query = `
            SELECT 
                a.*, 
                t.name as type_name, 
                t.normal_balance,
                COALESCE(
                    CASE 
                        WHEN UPPER(t.normal_balance) = 'DEBIT' THEN (SELECT SUM(debit) - SUM(credit) FROM accounting.journal_item WHERE account_id = a.id AND tenant_id = $1)
                        ELSE (SELECT SUM(credit) - SUM(debit) FROM accounting.journal_item WHERE account_id = a.id AND tenant_id = $1)
                    END,
                    0
                ) as raw_balance
            FROM accounting.chart_of_accounts a
            JOIN accounting.account_type t ON a.account_type_id = t.id
            WHERE a.tenant_id = $1 AND a.is_deleted = FALSE
        `;
        const params: any[] = [tenantId];

        if (search) {
            query += ` AND (a.name ILIKE $2 OR a.code ILIKE $2)`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY a.code ASC`;
        const res = await this.db.query(query, params);
        return res.rows;
    }

    public async list(tenantId: number, search?: string): Promise<any[]> {
        let query = `
            SELECT a.*, at.name as type_name, at.normal_balance
            FROM accounting.chart_of_accounts a
            JOIN accounting.account_type at ON a.account_type_id = at.id
            WHERE a.tenant_id = $1 AND a.is_deleted = FALSE
        `;
        const params: any[] = [tenantId];

        if (search) {
            query += ` AND (a.name ILIKE $2 OR a.code ILIKE $2)`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY a.code`;
        const res = await this.db.query(query, params);
        return res.rows;
    }

    public async findByCode(tenantId: number, code: string): Promise<any> {
        const res = await this.db.query(
            `SELECT * FROM accounting.chart_of_accounts 
             WHERE tenant_id = $1 AND code = $2 AND is_deleted = FALSE`,
            [tenantId, code]
        );
        return res.rows[0];
    }

    public async getAccountTypes(): Promise<any[]> {
        const res = await this.db.query(`SELECT * FROM accounting.account_type ORDER BY id`);
        return res.rows;
    }
}
