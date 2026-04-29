import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class GuardianHelper {
    constructor(@inject("DB") private db: Pool) {}

    public async createGuardian(
        data: any,
        db: Pool | any = this.db,
    ): Promise<any> {
        const res = await db.query(
            `INSERT INTO school.guardian
                (tenant_id, user_id, first_name, last_name, gender, phone, alternate_phone, 
                 email, address, occupation, income_range, id_number, avatar_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING id, first_name, last_name`,
            [
                data.tenant_id,
                data.user_id,
                data.first_name,
                data.last_name ?? null,
                data.gender ?? null,
                data.phone ?? null,
                data.alternate_phone ?? null,
                data.email,
                data.address ?? null,
                data.occupation ?? null,
                data.income_range ?? null,
                data.id_number ?? null,
                data.avatar_url ?? null,
            ],
        );
        return res.rows[0];
    }

    public async linkStudent(
        tenantId: number,
        studentId: number,
        guardianId: number,
        relation: string,
        isEmergency: boolean = false,
        db: Pool | any = this.db,
    ): Promise<void> {
        await db.query(
            `INSERT INTO school.student_guardian (tenant_id, student_id, guardian_id, relation, is_emergency)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (student_id, guardian_id) DO UPDATE SET relation = $4, is_emergency = $5, is_deleted = FALSE`,
            [tenantId, studentId, guardianId, relation, isEmergency],
        );
    }

    public async getStudentGuardians(tenantId: number, studentId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT g.*, sg.relation, sg.is_emergency
             FROM school.guardian g
             JOIN school.student_guardian sg ON g.id = sg.guardian_id
             WHERE sg.tenant_id = $1 AND sg.student_id = $2 AND sg.is_deleted = FALSE`,
            [tenantId, studentId],
        );
        return res.rows;
    }

    public async getGuardianStudents(tenantId: number, userId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT s.id, s.admission_no, s.first_name, s.last_name, s.gender, s.date_of_birth,
                    c.name as classroom_name, c.section, g.name as grade_name,
                    sg.relation, se.roll_number
             FROM school.student s
             JOIN school.student_guardian sg ON s.id = sg.student_id
             JOIN school.guardian p ON sg.guardian_id = p.id
             JOIN school.student_enrollment se ON s.id = se.student_id
             JOIN school.classroom c ON se.classroom_id = c.id
             JOIN school.grade g ON c.grade_id = g.id
             WHERE sg.tenant_id = $1 AND p.user_id = $2 
               AND sg.is_deleted = FALSE 
               AND se.status = 'active'`,
            [tenantId, userId],
        );
        return res.rows;
    }

    public async getStudentAttendance(tenantId: number, studentId: number): Promise<any> {
        // Attendance Summary
        const summaryRes = await this.db.query(
            `SELECT a.status, COUNT(*) as count
             FROM school.attendance a
             JOIN school.student_enrollment se ON a.enrollment_id = se.id
             WHERE se.tenant_id = $1 AND se.student_id = $2 AND se.is_deleted = FALSE
             GROUP BY a.status`,
            [tenantId, studentId]
        );

        // Recent 30 days records
        const recentRes = await this.db.query(
            `SELECT a.date, a.status, a.remarks
             FROM school.attendance a
             JOIN school.student_enrollment se ON a.enrollment_id = se.id
             WHERE se.tenant_id = $1 AND se.student_id = $2 AND se.is_deleted = FALSE
             ORDER BY a.date DESC
             LIMIT 30`,
            [tenantId, studentId]
        );

        return {
            summary: summaryRes.rows,
            recent: recentRes.rows
        };
    }

    public async getStudentExams(tenantId: number, studentId: number): Promise<any> {
        // Upcoming Exams (Based on paper dates)
        const upcomingRes = await this.db.query(
            `SELECT DISTINCT e.id, e.name as exam_name, sub.name as paper_name, p.exam_date as date, p.start_time, sub.name as subject_name
             FROM school.exam e
             JOIN school.exam_paper p ON e.id = p.exam_id
             JOIN school.exam_invitation ei ON e.id = ei.exam_id
             JOIN school.student_enrollment se ON ei.classroom_id = se.classroom_id
             JOIN school.subject sub ON p.subject_id = sub.id
             WHERE se.tenant_id = $1 AND se.student_id = $2 AND p.exam_date >= CURRENT_DATE AND e.is_deleted = FALSE
             ORDER BY p.exam_date ASC`,
            [tenantId, studentId]
        );

        // Past Exam Results (Using school.exam_result table)
        const resultsRes = await this.db.query(
            `SELECT e.name as exam_name, sub.name as subject_name, er.marks, er.max_marks, er.grade, 
                    (SELECT exam_date FROM school.exam_paper WHERE exam_id = e.id AND subject_id = sub.id LIMIT 1) as date
             FROM school.exam_result er
             JOIN school.exam e ON er.exam_id = e.id
             JOIN school.subject sub ON er.subject_id = sub.id
             WHERE er.tenant_id = $1 AND er.student_id = $2 AND er.is_deleted = FALSE
             ORDER BY date DESC`,
            [tenantId, studentId]
        );

        return {
            upcoming: upcomingRes.rows,
            past: resultsRes.rows
        };
    }

    public async getStudentClassroomDetails(tenantId: number, studentId: number): Promise<any> {
        const classRes = await this.db.query(
            `SELECT c.id, c.name, c.section, st.first_name as teacher_first_name, st.last_name as teacher_last_name, st.phone as teacher_phone
             FROM school.classroom c
             JOIN school.student_enrollment se ON c.id = se.classroom_id
             LEFT JOIN school.staff st ON c.class_teacher_id = st.id
             WHERE se.tenant_id = $1 AND se.student_id = $2 AND se.status = 'active'`,
            [tenantId, studentId]
        );

        const subjectsRes = await this.db.query(
            `SELECT sub.name as subject_name, st.first_name as teacher_first_name, st.last_name as teacher_last_name
             FROM school.teacher_assignment ta
             JOIN school.student_enrollment se ON ta.classroom_id = se.classroom_id
             JOIN school.subject sub ON ta.subject_id = sub.id
             JOIN school.staff st ON ta.staff_id = st.id
             WHERE se.tenant_id = $1 AND se.student_id = $2 AND se.status = 'active'`,
            [tenantId, studentId]
        );

        return {
            classroom: classRes.rows[0],
            subjects: subjectsRes.rows
        };
    }
}
