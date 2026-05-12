import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import BaseModel from "../../../core/models/BaseModel.js";

@injectable()
export default class AcademicYearHelper extends BaseModel {
    constructor(@inject("DB") private db: Pool) {
        super();
    }

    public async findCurrent(tenantId: number) {
        // 1. Try to find the explicitly marked current year
        const query = `
            SELECT * FROM school.academic_year
            WHERE tenant_id = $1 AND is_current = TRUE AND is_deleted = FALSE
            LIMIT 1
        `;
        let result = await this.db.query(query, [tenantId]);
        if (result.rows[0]) return result.rows[0];

        // 2. Fallback: return the most recent year if none is marked as current
        const fallbackQuery = `
            SELECT * FROM school.academic_year
            WHERE tenant_id = $1 AND is_deleted = FALSE
            ORDER BY start_date DESC
            LIMIT 1
        `;
        result = await this.db.query(fallbackQuery, [tenantId]);

        return result.rows[0];
    }

    public async findAll(tenantId: number) {
        const query = `
            SELECT * FROM school.academic_year
            WHERE tenant_id = $1 AND is_deleted = FALSE
            ORDER BY start_date DESC
        `;
        const result = await this.db.query(query, [tenantId]);
        return result.rows;
    }

    public async findById(tenantId: number, id: number) {
        const query = `
            SELECT * FROM school.academic_year
            WHERE tenant_id = $1 AND id = $2 AND is_deleted = FALSE
        `;
        const result = await this.db.query(query, [tenantId, id]);
        return result.rows[0];
    }

    public async isClosed(tenantId: number, id: number) {
        const year = await this.findById(tenantId, id);
        return year?.status === 'closed';
    }

    public async create(tenantId: number, data: { name: string; start_date: string; end_date: string; is_current?: boolean }) {
        const query = `
            INSERT INTO school.academic_year (tenant_id, name, start_date, end_date, is_current)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await this.db.query(query, [tenantId, data.name, data.start_date, data.end_date, data.is_current || false]);
        return result.rows[0];
    }
}
