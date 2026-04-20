import { injectable, inject } from "tsyringe";
import BaseModel from "../../../core/models/BaseModel.js";

@injectable()
export default class CourseHelper extends BaseModel {
    constructor(@inject("DB") private db: any) {
        super();
    }

    public async findAll(
        tenantId: number,
        filters: {
            page?: number;
            limit?: number;
            search?: string;
        } = {},
    ) {
        const page = Math.max(1, filters.page || 1);
        const limit = Math.max(1, Math.min(100, filters.limit || 10));
        const offset = (page - 1) * limit;

        let query = `
            SELECT *, COUNT(*) OVER() as total_count 
            FROM school.course 
            WHERE tenant_id = $1 AND is_deleted = FALSE 
        `;
        const values: any[] = [tenantId];
        let paramIndex = 2;

        if (filters.search) {
            query += ` AND (name ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`;
            values.push(`%${filters.search}%`);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        values.push(limit, offset);

        const result = await this.db.query(query, values);

        const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
        const courses = result.rows.map((row: any) => {
            const { total_count, ...data } = row;
            return data;
        });

        return {
            data: courses,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit),
            },
        };
    }

    public async findById(tenantId: number, id: number) {
        const query = `
            SELECT * FROM school.course 
            WHERE tenant_id = $1 AND id = $2 AND is_deleted = FALSE
        `;
        const result = await this.db.query(query, [tenantId, id]);
        return result.rows[0];
    }

    public async create(tenantId: number, data: any) {
        const query = `
            INSERT INTO school.course (tenant_id, name, code, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [tenantId, data.name, data.code, data.description];
        const result = await this.db.query(query, values);
        return result.rows[0];
    }

    public async update(tenantId: number, id: number, data: any) {
        const query = `
            UPDATE school.course SET
                name = COALESCE($3, name),
                code = COALESCE($4, code),
                description = COALESCE($5, description),
                updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2 AND is_deleted = FALSE
            RETURNING *
        `;
        const values = [tenantId, id, data.name, data.code, data.description];
        const result = await this.db.query(query, values);
        return result.rows[0];
    }

    public async delete(tenantId: number, id: number) {
        const query = `
            UPDATE school.course SET is_deleted = TRUE, updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
            RETURNING id
        `;
        const result = await this.db.query(query, [tenantId, id]);
        return result.rows[0];
    }
}
