import { injectable, inject } from "tsyringe";
import BaseModel from "../../../core/models/BaseModel.js";

export interface Homework {
    id: number;
    tenant_id: number;
    classroom_id: number;
    subject_id: number;
    staff_id: number;
    title: string;
    description: string;
    due_date: string;
    max_score: number;
    attachment_url?: string;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    classroom_name?: string;
    subject_name?: string;
    staff_name?: string;
}

@injectable()
export class HomeworkHelper extends BaseModel {
    constructor(@inject("DB") private db: any) {
        super();
    }

    async listHomework(tenantId: number, filters: any) {
        let query = `
            SELECT h.*, c.name as classroom_name, s.name as subject_name,
                   st.first_name || ' ' || st.last_name as staff_name
            FROM school.homework h
            JOIN school.classroom c ON h.classroom_id = c.id
            JOIN school.subject s ON h.subject_id = s.id
            JOIN school.staff st ON h.staff_id = st.id
            WHERE h.tenant_id = $1 AND h.is_deleted = FALSE
        `;
        const params: any[] = [tenantId];

        if (filters.classroomId) {
            query += ` AND h.classroom_id = $${params.length + 1}`;
            params.push(filters.classroomId);
        }

        if (filters.subjectId) {
            query += ` AND h.subject_id = $${params.length + 1}`;
            params.push(filters.subjectId);
        }

        if (filters.staffId) {
            query += ` AND h.staff_id = $${params.length + 1}`;
            params.push(filters.staffId);
        }

        query += ` ORDER BY h.due_date DESC, h.created_at DESC`;
        
        const result = await this.db.query(query, params);
        return result.rows;
    }

    async createHomework(tenantId: number, data: Partial<Homework>) {
        const query = `
            INSERT INTO school.homework (
                tenant_id, classroom_id, subject_id, staff_id, 
                title, description, due_date, max_score, attachment_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const values = [
            tenantId,
            data.classroom_id,
            data.subject_id,
            data.staff_id,
            data.title,
            data.description,
            data.due_date,
            data.max_score || 10,
            data.attachment_url
        ];
        const result = await this.db.query(query, values);
        return result.rows[0];
    }

    async updateHomework(tenantId: number, id: number, data: Partial<Homework>) {
        const query = `
            UPDATE school.homework
            SET title = COALESCE($3, title),
                description = COALESCE($4, description),
                due_date = COALESCE($5, due_date),
                max_score = COALESCE($6, max_score),
                attachment_url = COALESCE($7, attachment_url),
                is_deleted = COALESCE($8, is_deleted),
                updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
            RETURNING *
        `;
        const values = [
            tenantId,
            id,
            data.title,
            data.description,
            data.due_date,
            data.max_score,
            data.attachment_url,
            data.is_deleted
        ];
        const result = await this.db.query(query, values);
        return result.rows[0];
    }

    async findById(tenantId: number, id: number) {
        const query = `
            SELECT h.*, c.name as classroom_name, s.name as subject_name
            FROM school.homework h
            JOIN school.classroom c ON h.classroom_id = c.id
            JOIN school.subject s ON h.subject_id = s.id
            WHERE h.tenant_id = $1 AND h.id = $2 AND h.is_deleted = FALSE
        `;
        const result = await this.db.query(query, [tenantId, id]);
        return result.rows[0];
    }
}
