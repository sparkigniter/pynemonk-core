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

    public async findAllExams(tenantId: number, academicYearId: number, ids?: number[], classroomId?: number) {
        let query = `
            SELECT DISTINCT e.*, et.name as term_name
            FROM school.exam e
            LEFT JOIN school.exam_term et ON e.exam_term_id = et.id
            LEFT JOIN school.exam_invitation ei ON e.id = ei.exam_id AND ei.is_deleted = FALSE
            WHERE e.tenant_id = $1 AND e.academic_year_id = $2 AND e.is_deleted = FALSE
        `;
        const params: any[] = [tenantId, academicYearId];
        let paramIndex = 3;

        if (ids) {
            query += ` AND e.id = ANY($${paramIndex})`;
            params.push(ids);
            paramIndex++;
        }

        if (classroomId) {
            query += ` AND (ei.classroom_id = $${paramIndex} OR ei.grade_id = (SELECT grade_id FROM school.classroom WHERE id = $${paramIndex}))`;
            params.push(classroomId);
            paramIndex++;
        }

        query += ` ORDER BY e.start_date DESC`;
        const res = await this.db.query(query, params);
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
                tenant_id, exam_id, subject_id, exam_date, start_time, end_time, room, max_marks, passing_marks, supervisor_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const values = [
            data.tenant_id, data.exam_id, data.subject_id, data.exam_date,
            data.start_time, data.end_time, data.room, data.max_marks, data.passing_marks,
            data.supervisor_id || null
        ];
        const res = await this.db.query(query, values);
        return res.rows[0];
    }

    public async updatePaper(tenantId: number, id: number, data: any) {
        const query = `
            UPDATE school.exam_paper SET
                subject_id = COALESCE($3, subject_id),
                exam_date = COALESCE($4, exam_date),
                start_time = COALESCE($5, start_time),
                end_time = COALESCE($6, end_time),
                room = COALESCE($7, room),
                max_marks = COALESCE($8, max_marks),
                passing_marks = COALESCE($9, passing_marks),
                supervisor_id = COALESCE($10, supervisor_id),
                updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
            RETURNING *
        `;
        const values = [
            tenantId, id, data.subject_id, data.exam_date,
            data.start_time, data.end_time, data.room, data.max_marks, data.passing_marks,
            data.supervisor_id
        ];
        const res = await this.db.query(query, values);
        return res.rows[0];
    }

    public async findPapersByExam(tenantId: number, examId: number) {
        const query = `
            SELECT ep.*, s.name as subject_name, s.code as subject_code,
                   TRIM(CONCAT(st.first_name, ' ', st.last_name)) as supervisor_name
            FROM school.exam_paper ep
            JOIN school.subject s ON ep.subject_id = s.id
            LEFT JOIN school.staff st ON ep.supervisor_id = st.id
            WHERE ep.tenant_id = $1 AND ep.exam_id = $2 AND COALESCE(ep.is_deleted, FALSE) = FALSE
            ORDER BY ep.exam_date ASC, ep.start_time ASC
        `;
        const res = await this.db.query(query, [tenantId, examId]);
        return res.rows;
    }

    // ─── Exam Invitations ───────────────────────────────────────────────────

    public async createInvitation(data: any) {
        const query = `
            INSERT INTO school.exam_invitation (tenant_id, exam_id, grade_id, classroom_id, subject_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [data.tenant_id, data.exam_id, data.grade_id, data.classroom_id, data.subject_id || null];
        const res = await this.db.query(query, values);
        return res.rows[0];
    }

    public async findInvitationsByExam(tenantId: number, examId: number) {
        const query = `
            SELECT ei.*, g.name as grade_name, c.name as classroom_name, c.section as classroom_section, s.name as subject_name
            FROM school.exam_invitation ei
            LEFT JOIN school.grade g ON ei.grade_id = g.id
            LEFT JOIN school.classroom c ON ei.classroom_id = c.id
            LEFT JOIN school.subject s ON ei.subject_id = s.id
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

    public async getInvitedStudents(tenantId: number, examId: number, paperId?: number, classroomIds?: number[]) {
        console.log(`[ExamHelper] getInvitedStudents - tenant: ${tenantId}, exam: ${examId}, paper: ${paperId}, classrooms: ${classroomIds || 'ALL'}`);
        
        // If paperId is provided, we filter by the subject associated with that paper
        let subjectFilter = '';
        if (paperId) {
            subjectFilter = `AND (ei.subject_id IS NULL OR ei.subject_id = (SELECT subject_id FROM school.exam_paper WHERE id = ${paperId}))`;
        }

        let scopeFilter = '';
        if (classroomIds && classroomIds.length > 0) {
            scopeFilter = `AND c.id = ANY($3)`;
        }

        const query = `
            WITH invited_entities AS (
                SELECT grade_id, classroom_id, subject_id FROM school.exam_invitation ei
                WHERE tenant_id = $1 AND exam_id = $2 AND is_deleted = FALSE
                ${subjectFilter}
            )
            SELECT DISTINCT
                s.id as student_id, s.first_name, s.last_name, s.admission_no,
                c.id as classroom_id, c.name as classroom_name, c.section as classroom_section,
                COALESCE(es.is_excluded, FALSE) as is_excluded,
                es.exclusion_reason
            FROM school.student s
            JOIN school.student_enrollment se ON s.id = se.student_id AND se.is_deleted = FALSE
            JOIN school.classroom c ON se.classroom_id = c.id
            LEFT JOIN school.exam_student es ON s.id = es.student_id AND es.exam_id = $2
            WHERE s.tenant_id = $1 AND s.is_deleted = FALSE
            AND (
                c.grade_id IN (SELECT grade_id FROM invited_entities WHERE grade_id IS NOT NULL AND classroom_id IS NULL)
                OR
                c.id IN (SELECT classroom_id FROM invited_entities WHERE classroom_id IS NOT NULL)
            )
            ${scopeFilter}
        `;
        const values = classroomIds && classroomIds.length > 0 ? [tenantId, examId, classroomIds] : [tenantId, examId];
        const res = await this.db.query(query, values);
        
        console.log(`[ExamHelper] getInvitedStudents - Found ${res.rows.length} students`);
        return res.rows;
    }

    public async getPaginatedInvitedStudents(tenantId: number, examId: number, filters: {
        page: number,
        limit: number,
        search?: string,
        status?: string,
        grade_id?: number,
        classroom_id?: number,
        subject_id?: number
    }) {
        const offset = (filters.page - 1) * filters.limit;
        const params: any[] = [tenantId, examId];
        let paramIndex = 3;

        let filterSql = '';
        if (filters.search) {
            filterSql += ` AND (s.first_name ILIKE $${paramIndex} OR s.last_name ILIKE $${paramIndex} OR s.admission_no ILIKE $${paramIndex})`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }
        if (filters.status === 'included') {
            filterSql += ` AND COALESCE(es.is_excluded, FALSE) = FALSE`;
        } else if (filters.status === 'excluded') {
            filterSql += ` AND es.is_excluded = TRUE`;
        }
        if (filters.grade_id) {
            filterSql += ` AND c.grade_id = $${paramIndex}`;
            params.push(filters.grade_id);
            paramIndex++;
        }
        if (filters.classroom_id) {
            filterSql += ` AND c.id = $${paramIndex}`;
            params.push(filters.classroom_id);
            paramIndex++;
        }

        // Subject filter logic: filter students who belong to invitations that are either global or match the subject
        let invitationFilter = '';
        if (filters.subject_id) {
            invitationFilter = `AND (ei.subject_id IS NULL OR ei.subject_id = $${paramIndex})`;
            params.push(filters.subject_id);
            paramIndex++;
        }

        const query = `
            WITH invited_entities AS (
                SELECT grade_id, classroom_id FROM school.exam_invitation ei
                WHERE tenant_id = $1 AND exam_id = $2 AND is_deleted = FALSE
                ${invitationFilter}
            )
            SELECT DISTINCT
                s.id as student_id, s.first_name, s.last_name, s.admission_no,
                c.name as classroom_name, c.section as classroom_section,
                COALESCE(es.is_excluded, FALSE) as is_excluded,
                es.exclusion_reason,
                COUNT(*) OVER() as total_count
            FROM school.student s
            JOIN school.student_enrollment se ON s.id = se.student_id AND se.is_deleted = FALSE
            JOIN school.classroom c ON se.classroom_id = c.id
            LEFT JOIN school.exam_student es ON s.id = es.student_id AND es.exam_id = $2
            WHERE s.tenant_id = $1 AND s.is_deleted = FALSE
            AND (
                c.grade_id IN (SELECT grade_id FROM invited_entities WHERE grade_id IS NOT NULL AND classroom_id IS NULL)
                OR
                c.id IN (SELECT classroom_id FROM invited_entities WHERE classroom_id IS NOT NULL)
            )
            ${filterSql}
            ORDER BY s.first_name ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(filters.limit, offset);

        const res = await this.db.query(query, params);
        const totalCount = res.rows.length > 0 ? parseInt(res.rows[0].total_count) : 0;

        return {
            data: res.rows.map(({ total_count, ...rest }) => rest),
            pagination: {
                total: totalCount,
                page: filters.page,
                limit: filters.limit,
                pages: Math.ceil(totalCount / filters.limit)
            }
        };
    }

    public async saveMarks(tenantId: number, data: { paper_id: number, exam_id: number, student_id: number, marks_obtained?: number, is_absent: boolean, remarks?: string, created_by?: number }) {
        const query = `
            INSERT INTO school.exam_marks (tenant_id, paper_id, exam_id, student_id, marks_obtained, is_absent, remarks, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (paper_id, student_id) DO UPDATE SET
                marks_obtained = EXCLUDED.marks_obtained,
                is_absent = EXCLUDED.is_absent,
                remarks = EXCLUDED.remarks,
                created_by = EXCLUDED.created_by,
                updated_at = NOW()
            RETURNING *
        `;
        const values = [tenantId, data.paper_id, data.exam_id, data.student_id, data.marks_obtained, data.is_absent, data.remarks, data.created_by];
        const res = await this.db.query(query, values);
        return res.rows[0];
    }

    public async getMarksByPaper(tenantId: number, paperId: number) {
        const query = `
            SELECT em.*, CONCAT(up.first_name, ' ', up.last_name) as evaluator_name
            FROM school.exam_marks em
            LEFT JOIN auth.user u ON em.created_by = u.id
            LEFT JOIN auth.user_profile up ON u.id = up.user_id
            WHERE em.tenant_id = $1 AND em.paper_id = $2
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

    public async deletePaper(tenantId: number, paperId: number) {
        const query = `
            UPDATE school.exam_paper SET is_deleted = TRUE, updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
            RETURNING *
        `;
        const res = await this.db.query(query, [tenantId, paperId]);
        return res.rows[0];
    }

    public async updateExam(tenantId: number, id: number, data: any) {
        const query = `
            UPDATE school.exam SET 
                exam_term_id = COALESCE($3, exam_term_id),
                name = COALESCE($4, name),
                exam_type = COALESCE($5, exam_type),
                start_date = COALESCE($6, start_date),
                end_date = COALESCE($7, end_date),
                updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
            RETURNING *
        `;
        const values = [
            tenantId,
            id,
            data.exam_term_id,
            data.name,
            data.exam_type,
            data.start_date,
            data.end_date
        ];
        const res = await this.db.query(query, values);
        return res.rows[0];
    }
}
