import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class SettingsHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async getSettings(tenantId: number): Promise<any> {
        const res = await this.db.query(
            `SELECT * FROM accounting.settings WHERE tenant_id = $1`,
            [tenantId]
        );
        
        if (res.rows.length === 0) {
            // Return defaults if not set
            return {
                base_currency: 'USD',
                currency_symbol: '$'
            };
        }
        
        return res.rows[0];
    }

    public async updateSettings(tenantId: number, data: any): Promise<any> {
        const res = await this.db.query(
            `INSERT INTO accounting.settings (tenant_id, base_currency, currency_symbol, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (tenant_id) DO UPDATE 
             SET base_currency = EXCLUDED.base_currency,
                 currency_symbol = EXCLUDED.currency_symbol,
                 updated_at = NOW()
             RETURNING *`,
            [tenantId, data.base_currency, data.currency_symbol]
        );
        return res.rows[0];
    }
}
