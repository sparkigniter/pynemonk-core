import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import BaseModel from "../../../core/models/BaseModel.js";

@injectable()
export class ExamHelper extends BaseModel {
    constructor(@inject("DB") private db: Pool) {
        super();
    }

    // ─── Exam Terms ──────────────────────────────────────────────────────────

    public async createTerm(data: any) {
        const query = `
            INSERT INTO school.exam_term (tenant_id, academic_year_id, name, start_date, end_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [
            data.tenant_id, 
            data.academic_year_id, 
            data.name, 
            data.start_date || null, 
            data.end_date || null
        ];
        const res = await this.db.query(query, values);
        return res.rows[0];
    }

    public async findAllTerms(tenantId: number, academicYearId: number) {
        const query = `
            SELECT * FROM school.exam_term 
            WHERE tenant_id = $1 AND academic_year_id = $2 AND is_deleted = FALSE
            ORDER BY created_at ASC
        `;
        const res = await this.db.query(query, [tenantId, academicYearId]);
        return res.rows;
    }

    // ─── Exams ───────────────────────────────────────────────────────────────

    public async createExam(data: any) {
        const query = `
            INSERT INTO school.exam (tenant_id, academic_year_id, exam_term_id, name, exam_type, start_date, end_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [
            data.tenant_id,
            data.academic_year_id,
            data.exam_term_id,
            data.name,
            data.exam_type || 'periodic',
            data.start_date || null,
            data.end_date || null
        ];
        const res = await this.db.query(query, values);
        return res.rows[0];
    }

    public async findAllExams(tenantId: number, academicYearId: number) {
        const query = `
            SELECT e.*, et.name as term_name
            FROM school.exam e
            LEFT JOIN school.exam_term et ON e.exam_term_id = et.id
            WHERE e.tenant_id = $1 AND e.academic_year_id = $2 AND e.is_deleted = FALSE
            ORDER BY e.start_date DESC
        `;
        const res = await this.db.query(query, [tenantId, academicYearId]);
        return res.rows;
    }

    public async findById(tenantId: number, id: number) {
        const query = `
            SELECT e.*, et.name as term_name
            FROM school.exam e
            LEFT JOIN school.exam_term et ON e.exam_term_id = et.id
            WHERE e.tenant_id = $1 AND e.id = $2 AND e.is_deleted = FALSE
        `;
        const res = await this.db.query(query, [tenantId, id]);
        return res.rows[0];
    }

    // ─── Exam Papers (Schedule) ──────────────────────────────────────────────

    public async createPaper(data: any) {
        const query = `
            INSERT INTO school.exam_paper (
                tenant_id, exam_id, subject_id, exam_date, start_time, end_time, room, max_marks, passing_marks
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const values = [
            data.tenant_id, data.exam_id, data.subject_id, data.exam_date,
            data.start_time, data.end_time, data.room, data.max_marks, data.passing_marks
        ];
        const res = await this.db.query(query, values);
        return res.rows[0];
    }

    public async findPapersByExam(tenantId: number, examId: number) {
        const query = `
            SELECT ep.*, s.name as subject_name, s.code as subject_code
            FROM school.exam_paper ep
            JOIN school.subject s ON ep.subject_id = s.id
            WHERE ep.tenant_id = $1 AND ep.exam_id = $2 AND ep.is_deleted = FALSE
            ORDER BY ep.exam_date ASC, ep.start_time ASC
        `;
        const res = await this.db.query(query, [tenantId, examId]);
        return res.rows;
    }

    // ─── Exam Invitations ───────────────────────────────────────────────────

    public async createInvitation(data: any) {
        const query = `
            INSERT INTO school.exam_invitation (tenant_id, exam_id, grade_id, classroom_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [data.tenant_id, data.exam_id, data.grade_id, data.classroom_id];
        const res = await this.db.query(query, values);
        return res.rows[0];
    }

    public async findInvitationsByExam(tenantId: number, examId: number) {
        const query = `
            SELECT ei.*, g.name as grade_name, c.name as classroom_name, c.section as classroom_section
            FROM school.exam_invitation ei
            LEFT JOIN school.grade g ON ei.grade_id = g.id
            LEFT JOIN school.classroom c ON ei.classroom_id = c.id
            WHERE ei.tenant_id = $1 AND ei.exam_id = $2 AND ei.is_deleted = FALSE
        `;
        const res = await this.db.query(query, [tenantId, examId]);
        return res.rows;
    }

    // ─── Exam Students (Invitations/Exclusions) ───────────────────────────────

    public async upsertExamStudent(data: any) {
        const query = `
            INSERT INTO school.exam_student (tenant_id, exam_id, student_id, is_excluded, exclusion_reason)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (exam_id, student_id) DO UPDATE SET
                is_excluded = EXCLUDED.is_excluded,
                exclusion_reason = EXCLUDED.exclusion_reason,
                updated_at = NOW()
            RETURNING *
        `;
        const values = [data.tenant_id, data.exam_id, data.student_id, data.is_excluded, data.exclusion_reason];
        const res = await this.db.query(query, values);
        return res.rows[0];
    }

    public async findStudentsByExam(tenantId: number, examId: number) {
        const query = `
            SELECT 
                s.id as student_id, s.first_name, s.last_name, s.admission_no,
                es.is_excluded, es.exclusion_reason,
                c.name as classroom_name, c.section as classroom_section
            FROM school.exam_student es
            JOIN school.student s ON es.student_id = s.id
            JOIN school.student_enrollment se ON s.id = se.student_id AND se.is_deleted = FALSE
            JOIN school.classroom c ON se.classroom_id = c.id
            WHERE es.tenant_id = $1 AND es.exam_id = $2 AND es.is_deleted = FALSE
        `;
        const res = await this.db.query(query, [tenantId, examId]);
        return res.rows;
    }

    public async getInvitedStudents(tenantId: number, examId: number) {
        // This query finds all students who SHOULD be in the exam based on Grade/Classroom invitations
        // and joins with exam_student to see their exclusion status.
        const query = `
            WITH invited_entities AS (
                SELECT grade_id, classroom_id FROM school.exam_invitation
                WHERE tenant_id = $1 AND exam_id = $2 AND is_deleted = FALSE
            )
            SELECT 
                s.id as student_id, s.first_name, s.last_name, s.admission_no,
                c.name as classroom_name, c.section as classroom_section,
                COALESCE(es.is_excluded, FALSE) as is_excluded,
                es.exclusion_reason
            FROM school.student s
            JOIN school.student_enrollment se ON s.id = se.student_id AND se.is_deleted = FALSE
            JOIN school.classroom c ON se.classroom_id = c.id
            LEFT JOIN school.exam_student es ON s.id = es.student_id AND es.exam_id = $2
            WHERE s.tenant_id = $1 AND s.is_deleted = FALSE
            AND (
                c.grade_id IN (SELECT grade_id FROM invited_entities WHERE grade_id IS NOT NULL)
                OR
                c.id IN (SELECT classroom_id FROM invited_entities WHERE classroom_id IS NOT NULL)
            )
        `;
        const res = await this.db.query(query, [tenantId, examId]);
        return res.rows;
    }

    public async saveMarks(tenantId: number, data: { paper_id: number, exam_id: number, student_id: number, marks_obtained?: number, is_absent: boolean, remarks?: string }) {
        const query = `
            INSERT INTO school.exam_marks (tenant_id, paper_id, exam_id, student_id, marks_obtained, is_absent, remarks)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (paper_id, student_id) DO UPDATE SET
                marks_obtained = EXCLUDED.marks_obtained,
                is_absent = EXCLUDED.is_absent,
                remarks = EXCLUDED.remarks,
                updated_at = NOW()
            RETURNING *
        `;
        const values = [tenantId, data.paper_id, data.exam_id, data.student_id, data.marks_obtained, data.is_absent, data.remarks];
        const res = await this.db.query(query, values);
        return res.rows[0];
    }

    public async getMarksByPaper(tenantId: number, paperId: number) {
        const query = `
            SELECT * FROM school.exam_marks
            WHERE tenant_id = $1 AND paper_id = $2
        `;
        const res = await this.db.query(query, [tenantId, paperId]);
        return res.rows;
    }

    public async updateExamStatus(tenantId: number, examId: number, status: string) {
        const query = `
            UPDATE school.exam SET status = $3, updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
            RETURNING *
        `;
        const res = await this.db.query(query, [tenantId, examId, status]);
        return res.rows[0];
    }
}
