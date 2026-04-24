import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

export interface SchoolEvent {
    id?: number;
    tenant_id: number;
    title: string;
    description?: string;
    event_type: string;
    start_date: string;
    end_date: string;
}

@injectable()
export class EventService {
    constructor(@inject("DB") private pool: Pool) {}

    async list(tenantId: number) {
        const query = `
            SELECT * FROM school.event 
            WHERE tenant_id = $1 AND is_deleted = FALSE 
            ORDER BY start_date ASC
        `;
        const result = await this.pool.query(query, [tenantId]);
        return result.rows;
    }

    async create(data: SchoolEvent) {
        const query = `
            INSERT INTO school.event (tenant_id, title, description, event_type, start_date, end_date)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const values = [data.tenant_id, data.title, data.description, data.event_type || 'general', data.start_date, data.end_date];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async update(tenantId: number, id: number, data: Partial<SchoolEvent>) {
        const query = `
            UPDATE school.event 
            SET title = COALESCE($3, title),
                description = COALESCE($4, description),
                event_type = COALESCE($5, event_type),
                start_date = COALESCE($6, start_date),
                end_date = COALESCE($7, end_date),
                updated_at = NOW()
            WHERE id = $1 AND tenant_id = $2 AND is_deleted = FALSE
            RETURNING *
        `;
        const values = [id, tenantId, data.title, data.description, data.event_type, data.start_date, data.end_date];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async delete(tenantId: number, id: number) {
        await this.pool.query('UPDATE school.event SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    }
}
