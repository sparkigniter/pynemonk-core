import { injectable, inject } from "tsyringe";
import BaseModel from "../../../core/models/BaseModel.js";

@injectable()
export default class CourseHelper extends BaseModel {
    constructor(@inject("DB") private db: any) {
        super();
    }

    public async findAll(tenantId: number) {
        const query = `
            SELECT * FROM school.course 
            WHERE tenant_id = $1 AND is_deleted = FALSE 
            ORDER BY created_at DESC
        `;
        const result = await this.db.query(query, [tenantId]);
        return result.rows;
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
