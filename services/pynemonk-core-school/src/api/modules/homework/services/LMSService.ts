import { injectable, inject } from 'tsyringe';
import { Pool } from 'pg';
import { Logger } from '../../../core/utils/Logger.js';

@injectable()
export class LMSService {
    constructor(@inject('DB') private pool: Pool) {}

    // --- RESOURCE LIBRARY ---

    async listResources(tenantId: number, filters: any) {
        let query = `
            SELECT r.*, s.name as subject_name, g.name as grade_name, c.name as classroom_name
            FROM school.lms_resource r
            LEFT JOIN school.subject s ON r.subject_id = s.id
            LEFT JOIN school.grade g ON r.grade_id = g.id
            LEFT JOIN school.classroom c ON r.classroom_id = c.id
            WHERE r.tenant_id = $1 AND r.is_deleted = FALSE
        `;
        const values: any[] = [tenantId];
        let pIdx = 2;

        if (filters.subject_id) {
            query += ` AND r.subject_id = $${pIdx++}`;
            values.push(filters.subject_id);
        }
        if (filters.grade_id) {
            query += ` AND r.grade_id = $${pIdx++}`;
            values.push(filters.grade_id);
        }
        if (filters.classroom_id) {
            query += ` AND (r.classroom_id = $${pIdx++} OR r.classroom_id IS NULL)`;
            values.push(filters.classroom_id);
        }

        query += ` ORDER BY r.created_at DESC`;
        const res = await this.pool.query(query, values);
        return res.rows;
    }

    async createResource(tenantId: number, data: any, userId: number) {
        const query = `
            INSERT INTO school.lms_resource 
            (tenant_id, title, description, resource_type, url, subject_id, grade_id, classroom_id, created_by, tags, is_public)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;
        const values = [
            tenantId, data.title, data.description, data.resource_type, 
            data.url, data.subject_id, data.grade_id, data.classroom_id, 
            userId, data.tags || [], data.is_public || false
        ];
        const res = await this.pool.query(query, values);
        return res.rows[0];
    }

    // --- SUBMISSIONS & GRADING ---

    async submitAssignment(tenantId: number, studentId: number, data: any) {
        // Check if homework exists and is not expired (optional)
        const homework = await this.pool.query(
            `SELECT due_date FROM school.homework WHERE id = $1 AND tenant_id = $2`,
            [data.homework_id, tenantId]
        );
        if (homework.rows.length === 0) throw new Error("Assignment not found");

        const isLate = new Date() > new Date(homework.rows[0].due_date);
        const status = isLate ? 'late' : 'submitted';

        const query = `
            INSERT INTO school.lms_submission 
            (tenant_id, homework_id, student_id, submission_text, file_urls, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (homework_id, student_id) 
            DO UPDATE SET 
                submission_text = EXCLUDED.submission_text,
                file_urls = EXCLUDED.file_urls,
                status = EXCLUDED.status,
                submitted_at = NOW(),
                updated_at = NOW()
            RETURNING *
        `;
        const values = [tenantId, data.homework_id, studentId, data.submission_text, data.file_urls || [], status];
        const res = await this.pool.query(query, values);
        return res.rows[0];
    }

    async gradeSubmission(tenantId: number, submissionId: number, data: any, teacherUserId: number) {
        const query = `
            UPDATE school.lms_submission
            SET 
                marks_obtained = $1,
                teacher_feedback = $2,
                graded_by = $3,
                graded_at = NOW(),
                status = 'graded',
                updated_at = NOW()
            WHERE id = $4 AND tenant_id = $5
            RETURNING *
        `;
        const values = [data.marks_obtained, data.teacher_feedback, teacherUserId, submissionId, tenantId];
        const res = await this.pool.query(query, values);
        return res.rows[0];
    }

    async getSubmissionsForHomework(tenantId: number, homeworkId: number) {
        const query = `
            SELECT sub.*, s.first_name, s.last_name, s.admission_number
            FROM school.lms_submission sub
            JOIN school.student s ON sub.student_id = s.id
            WHERE sub.homework_id = $1 AND sub.tenant_id = $2 AND sub.is_deleted = FALSE
            ORDER BY sub.submitted_at DESC
        `;
        const res = await this.pool.query(query, [homeworkId, tenantId]);
        return res.rows;
    }

    async getStudentSubmissions(tenantId: number, studentId: number) {
        const query = `
            SELECT sub.*, h.title as homework_title, h.due_date, subj.name as subject_name
            FROM school.lms_submission sub
            JOIN school.homework h ON sub.homework_id = h.id
            JOIN school.subject subj ON h.subject_id = subj.id
            WHERE sub.student_id = $1 AND sub.tenant_id = $2 AND sub.is_deleted = FALSE
            ORDER BY h.due_date DESC
        `;
        const res = await this.pool.query(query, [studentId, tenantId]);
        return res.rows;
    }
}
