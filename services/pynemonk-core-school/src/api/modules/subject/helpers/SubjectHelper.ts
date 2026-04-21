import { injectable, inject } from "tsyringe";
import BaseModel from "../../../core/models/BaseModel.js";

export interface Subject {
    id: number;
    tenant_id: number;
    grade_id: number;
    name: string;
    code: string;
    description?: string;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

@injectable()
export default class SubjectHelper extends BaseModel {
    constructor(@inject("DB") private db: any) {
        super();
    }

    public async findAll(
        tenantId: number,
        filters: {
            grade_id?: number;
            search?: string;
        } = {},
    ) {
        let query = `
            SELECT s.*, g.name as grade_name 
            FROM school.subject s
            JOIN school.grade g ON s.grade_id = g.id
            WHERE s.tenant_id = $1 AND s.is_deleted = FALSE 
        `;
        const values: any[] = [tenantId];
        let paramIndex = 2;

        if (filters.grade_id) {
            query += ` AND s.grade_id = $${paramIndex}`;
            values.push(filters.grade_id);
            paramIndex++;
        }

        if (filters.search) {
            query += ` AND (s.name ILIKE $${paramIndex} OR s.code ILIKE $${paramIndex})`;
            values.push(`%${filters.search}%`);
            paramIndex++;
        }

        query += ` ORDER BY g.sequence_order ASC, s.name ASC`;

        const result = await this.db.query(query, values);
        return result.rows;
    }

    public async findById(tenantId: number, id: number) {
        const query = `
            SELECT s.*, g.name as grade_name 
            FROM school.subject s
            JOIN school.grade g ON s.grade_id = g.id
            WHERE s.tenant_id = $1 AND s.id = $2 AND s.is_deleted = FALSE
        `;
        const result = await this.db.query(query, [tenantId, id]);
        return result.rows[0];
    }

    public async create(tenantId: number, data: any) {
        const query = `
            INSERT INTO school.subject (tenant_id, grade_id, name, code, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [tenantId, data.grade_id, data.name, data.code, data.description];
        const result = await this.db.query(query, values);
        return result.rows[0];
    }

    public async update(tenantId: number, id: number, data: any) {
        const query = `
            UPDATE school.subject SET
                grade_id = COALESCE($3, grade_id),
                name = COALESCE($4, name),
                code = COALESCE($5, code),
                description = COALESCE($6, description),
                updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2 AND is_deleted = FALSE
            RETURNING *
        `;
        const values = [tenantId, id, data.grade_id, data.name, data.code, data.description];
        const result = await this.db.query(query, values);
        return result.rows[0];
    }

    public async delete(tenantId: number, id: number) {
        const query = `
            UPDATE school.subject SET is_deleted = TRUE, updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
            RETURNING id
        `;
        const result = await this.db.query(query, [tenantId, id]);
        return result.rows[0];
    }

    // Teacher Assignment methods
    public async assignTeacher(tenantId: number, data: {
        staff_id: number;
        classroom_id: number;
        subject_id: number;
        academic_year_id: number;
    }) {
        // Validation: Ensure subject and classroom belong to the same grade
        const validationQuery = `
            SELECT 
                (SELECT grade_id FROM school.subject WHERE id = $1 AND tenant_id = $3 AND is_deleted = FALSE) as subject_grade,
                (SELECT grade_id FROM school.classroom WHERE id = $2 AND tenant_id = $3 AND is_deleted = FALSE) as classroom_grade
        `;
        const validationRes = await this.db.query(validationQuery, [data.subject_id, data.classroom_id, tenantId]);
        const { subject_grade, classroom_grade } = validationRes.rows[0];

        if (!subject_grade) throw new Error("Subject not found or deleted");
        if (!classroom_grade) throw new Error("Classroom not found or deleted");
        
        if (subject_grade !== classroom_grade) {
            throw new Error("Mismatched Grade: Subject and Classroom must belong to the same grade");
        }

        const query = `
            INSERT INTO school.teacher_assignment 
                (tenant_id, staff_id, classroom_id, subject_id, academic_year_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (staff_id, classroom_id, subject_id, academic_year_id) 
            DO UPDATE SET updated_at = NOW(), is_deleted = FALSE
            RETURNING *
        `;
        const values = [tenantId, data.staff_id, data.classroom_id, data.subject_id, data.academic_year_id];
        const result = await this.db.query(query, values);
        
        // Return full assignment details for UI convenience
        const rows = await this.getAssignments(tenantId, { 
            staff_id: data.staff_id, 
            classroom_id: data.classroom_id, 
            subject_id: data.subject_id, 
            academic_year_id: data.academic_year_id 
        });
        return rows[0] || result.rows[0];
    }

    public async getAssignments(tenantId: number, filters: {
        classroom_id?: number;
        subject_id?: number;
        staff_id?: number;
        academic_year_id?: number;
    }) {
        let query = `
            SELECT ta.*, 
                   s.first_name || ' ' || s.last_name as teacher_name,
                   sub.name as subject_name,
                   c.name as classroom_name
            FROM school.teacher_assignment ta
            JOIN school.staff s ON ta.staff_id = s.id AND s.is_deleted = FALSE
            JOIN school.subject sub ON ta.subject_id = sub.id AND sub.is_deleted = FALSE
            JOIN school.classroom c ON ta.classroom_id = c.id AND c.is_deleted = FALSE
            WHERE ta.tenant_id = $1 AND ta.is_deleted = FALSE
        `;
        const values: any[] = [tenantId];
        let paramIndex = 2;

        if (filters.classroom_id) {
            query += ` AND ta.classroom_id = $${paramIndex}`;
            values.push(filters.classroom_id);
            paramIndex++;
        }
        if (filters.subject_id) {
            query += ` AND ta.subject_id = $${paramIndex}`;
            values.push(filters.subject_id);
            paramIndex++;
        }
        if (filters.staff_id) {
            query += ` AND ta.staff_id = $${paramIndex}`;
            values.push(filters.staff_id);
            paramIndex++;
        }
        if (filters.academic_year_id) {
            query += ` AND ta.academic_year_id = $${paramIndex}`;
            values.push(filters.academic_year_id);
            paramIndex++;
        }

        const result = await this.db.query(query, values);
        return result.rows;
    }
}
