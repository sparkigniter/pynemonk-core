import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class FeeCategoryHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async create(tenantId: number, name: string, description?: string, isMandatory: boolean = true): Promise<any> {
        const res = await this.db.query(
            `INSERT INTO accounting.fee_category
                (tenant_id, name, description, is_mandatory)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [tenantId, name, description ?? null, isMandatory]
        );
        return res.rows[0];
    }

    public async list(tenantId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT * FROM accounting.fee_category
             WHERE tenant_id = $1 AND is_deleted = false
             ORDER BY created_at DESC`,
            [tenantId]
        );
        return res.rows;
    }

    public async findByName(tenantId: number, name: string): Promise<any> {
        const res = await this.db.query(
            `SELECT * FROM accounting.fee_category
             WHERE tenant_id = $1 AND name = $2 AND is_deleted = false`,
            [tenantId, name]
        );
        return res.rows[0];
    }
}
