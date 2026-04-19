import { injectable, inject } from "tsyringe";
import pool from "../../../../db/pg-pool.js";
import BaseModel from "../../../core/models/BaseModel.js";

@injectable()
export default class ClassroomHelper extends BaseModel {
    constructor(@inject("DB") private db: any) {
        super();
    }

    public async findAll(tenantId: number, academicYearId?: number) {
        let query = `
            SELECT c.*, s.first_name as teacher_first_name, s.last_name as teacher_last_name
            FROM school.classroom c
            LEFT JOIN school.staff s ON c.class_teacher_id = s.id
            WHERE c.tenant_id = $1 AND c.is_deleted = FALSE
        `;
        const params: any[] = [tenantId];
        if (academicYearId) {
            query += ` AND c.academic_year_id = $2`;
            params.push(academicYearId);
        }
        query += ` ORDER BY c.grade, c.section`;
        const result = await pool.query(query, params);
        return result.rows;
    }

    public async findById(tenantId: number, id: number) {
        const query = `
            SELECT c.*, s.first_name as teacher_first_name, s.last_name as teacher_last_name
            FROM school.classroom c
            LEFT JOIN school.staff s ON c.class_teacher_id = s.id
            WHERE c.tenant_id = $1 AND c.id = $2 AND c.is_deleted = FALSE
        `;
        const result = await pool.query(query, [tenantId, id]);
        return result.rows[0];
    }

    public async create(data: any) {
        const query = `
            INSERT INTO school.classroom (
                tenant_id, academic_year_id, grade, section, name, room, capacity, class_teacher_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const values = [
            data.tenant_id, data.academic_year_id, data.grade, data.section,
            data.name, data.room, data.capacity, data.class_teacher_id
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    public async update(tenantId: number, id: number, data: any) {
        const query = `
            UPDATE school.classroom SET
                academic_year_id = COALESCE($3, academic_year_id),
                grade = COALESCE($4, grade),
                section = COALESCE($5, section),
                name = COALESCE($6, name),
                room = COALESCE($7, room),
                capacity = COALESCE($8, capacity),
                class_teacher_id = COALESCE($9, class_teacher_id),
                updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2 AND is_deleted = FALSE
            RETURNING *
        `;
        const values = [
            tenantId, id, data.academic_year_id, data.grade, data.section,
            data.name, data.room, data.capacity, data.class_teacher_id
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    public async delete(tenantId: number, id: number) {
        const query = `
            UPDATE school.classroom SET is_deleted = TRUE, updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
            RETURNING id
        `;
        const result = await pool.query(query, [tenantId, id]);
        return result.rows[0];
    }
}
