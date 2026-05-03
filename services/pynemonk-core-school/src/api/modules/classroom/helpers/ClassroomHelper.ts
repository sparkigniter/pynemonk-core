import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import BaseModel from "../../../core/models/BaseModel.js";

@injectable()
export default class ClassroomHelper extends BaseModel {
    constructor(@inject("DB") private db: Pool) {
        super();
    }

    public async findAll(tenantId: number, filters: {
        academic_year_id?: number;
        grade_id?: number;
        ids?: number[];
        search?: string;
        page?: number;
        limit?: number;
    } = {}) {
        let query = `
            SELECT c.*, g.name as grade_name, s.first_name as teacher_first_name, s.last_name as teacher_last_name
            FROM school.classroom c
            JOIN school.grade g ON c.grade_id = g.id AND g.is_deleted = FALSE
            LEFT JOIN school.staff s ON c.class_teacher_id = s.id AND s.is_deleted = FALSE
            WHERE c.tenant_id = $1 AND c.is_deleted = FALSE
        `;
        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (filters.academic_year_id) {
            query += ` AND c.academic_year_id = $${paramIndex}`;
            params.push(filters.academic_year_id);
            paramIndex++;
        }

        if (filters.grade_id) {
            query += ` AND c.grade_id = $${paramIndex}`;
            params.push(filters.grade_id);
            paramIndex++;
        }

        if (filters.ids) {
            query += ` AND c.id = ANY($${paramIndex})`;
            params.push(filters.ids);
            paramIndex++;
        }

        if (filters.search) {
            query += ` AND (c.name ILIKE $${paramIndex} OR c.section ILIKE $${paramIndex})`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        query += ` ORDER BY g.sequence_order, c.section`;

        if (filters.limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(filters.limit);
            paramIndex++;

            if (filters.page) {
                const offset = (filters.page - 1) * filters.limit;
                query += ` OFFSET $${paramIndex}`;
                params.push(offset);
                paramIndex++;
            }
        }

        const result = await this.db.query(query, params);

        // Count query
        let countQuery = `SELECT COUNT(*) FROM school.classroom c WHERE c.tenant_id = $1 AND c.is_deleted = FALSE`;
        const countParams: any[] = [tenantId];
        if (filters.academic_year_id) {
            countQuery += ` AND c.academic_year_id = $2`;
            countParams.push(filters.academic_year_id);
        }
        if (filters.grade_id) {
            countQuery += ` AND c.grade_id = $${countParams.length + 1}`;
            countParams.push(filters.grade_id);
        }
        if (filters.ids) {
            countQuery += ` AND c.id = ANY($${countParams.length + 1})`;
            countParams.push(filters.ids);
        }
        if (filters.search) {
            countQuery += ` AND (c.name ILIKE $${countParams.length + 1} OR c.section ILIKE $${countParams.length + 1})`;
            countParams.push(`%${filters.search}%`);
        }

        const countRes = await this.db.query(countQuery, countParams);

        return {
            data: result.rows,
            pagination: {
                total: parseInt(countRes.rows[0].count),
                page: filters.page || 1,
                limit: filters.limit || result.rows.length,
                pages: Math.ceil(parseInt(countRes.rows[0].count) / (filters.limit || result.rows.length || 1))
            }
        };
    }

    public async findById(tenantId: number, id: number) {
        const query = `
            SELECT c.*, g.name as grade_name, s.first_name as teacher_first_name, s.last_name as teacher_last_name
            FROM school.classroom c
            JOIN school.grade g ON c.grade_id = g.id
            LEFT JOIN school.staff s ON c.class_teacher_id = s.id
            WHERE c.tenant_id = $1 AND c.id = $2 AND c.is_deleted = FALSE
        `;
        const result = await this.db.query(query, [tenantId, id]);
        return result.rows[0];
    }

    public async findByGradeAndSection(
        tenantId: number,
        academicYearId: number,
        gradeId: number,
        section: string,
    ) {
        const query = `
            SELECT * FROM school.classroom
            WHERE tenant_id = $1 AND academic_year_id = $2 AND grade_id = $3 AND section = $4 AND is_deleted = FALSE
        `;
        const result = await this.db.query(query, [tenantId, academicYearId, gradeId, section]);
        return result.rows[0];
    }

    public async create(data: any) {
        const query = `
            INSERT INTO school.classroom (
                tenant_id, academic_year_id, grade_id, section, name, room, capacity, class_teacher_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const values = [
            data.tenant_id,
            data.academic_year_id,
            data.grade_id,
            data.section,
            data.name,
            data.room,
            data.capacity,
            data.class_teacher_id,
        ];
        const result = await this.db.query(query, values);
        return result.rows[0];
    }

    public async update(tenantId: number, id: number, data: any) {
        const query = `
            UPDATE school.classroom SET
                academic_year_id = COALESCE($3, academic_year_id),
                grade_id = COALESCE($4, grade_id),
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
            tenantId,
            id,
            data.academic_year_id,
            data.grade_id,
            data.section,
            data.name,
            data.room,
            data.capacity,
            data.class_teacher_id,
        ];
        const result = await this.db.query(query, values);
        return result.rows[0];
    }

    public async delete(tenantId: number, id: number) {
        const query = `
            UPDATE school.classroom SET is_deleted = TRUE, updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
            RETURNING id
        `;
        const result = await this.db.query(query, [tenantId, id]);
        return result.rows[0];
    }
}
