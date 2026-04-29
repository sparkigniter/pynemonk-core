import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
export default class TeacherHelper {
    constructor(@inject("DB") private db: Pool) { }

    /**
     * Get all classes and subjects assigned to a teacher
     */
    public async getTeacherAssignments(userId: number, tenantId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT DISTINCT ON (c.id, s.id)
                c.id as classroom_id, 
                c.name as classroom_name, 
                c.section,
                g.name as grade_name,
                s.id as subject_id, 
                COALESCE(s.name, 'Class Management') as subject_name,
                (c.class_teacher_id = st.id) as is_class_teacher,
                EXISTS (
                    SELECT 1 FROM school.timetable t
                    WHERE t.teacher_id = st.id 
                    AND t.classroom_id = c.id 
                    AND (t.subject_id = s.id OR s.id IS NULL)
                    AND t.day_of_week = EXTRACT(ISODOW FROM CURRENT_DATE)
                    AND t.is_deleted = FALSE
                    AND t.tenant_id = $2
                ) as is_scheduled_today,
                CASE 
                    WHEN COALESCE(sett.attendance_mode, 'DAILY') = 'DAILY' THEN (c.class_teacher_id = st.id)
                    ELSE EXISTS (
                        SELECT 1 FROM school.timetable t
                        WHERE t.teacher_id = st.id 
                        AND t.classroom_id = c.id 
                        AND (t.subject_id = s.id OR s.id IS NULL)
                        AND t.day_of_week = EXTRACT(ISODOW FROM CURRENT_DATE)
                        AND t.is_deleted = FALSE
                        AND t.tenant_id = $2
                    )
                END as can_take_attendance
             FROM school.staff st
             JOIN school.academic_year ay ON ay.is_current = TRUE AND ay.tenant_id = $2
             LEFT JOIN school.settings sett ON sett.tenant_id = $2
             JOIN school.classroom c ON (c.class_teacher_id = st.id OR EXISTS (
                 SELECT 1 FROM school.teacher_assignment ta 
                 WHERE ta.staff_id = st.id AND ta.classroom_id = c.id AND ta.is_deleted = FALSE AND ta.academic_year_id = ay.id
             ))
             JOIN school.grade g ON c.grade_id = g.id
             LEFT JOIN school.teacher_assignment ta ON (ta.staff_id = st.id AND ta.classroom_id = c.id AND ta.is_deleted = FALSE AND ta.academic_year_id = ay.id)
             LEFT JOIN school.subject s ON (ta.subject_id = s.id)
             WHERE st.user_id = $1 
             AND st.tenant_id = $2
             AND st.is_deleted = FALSE 
             AND c.is_deleted = FALSE
             AND c.academic_year_id = ay.id`,
            [userId, tenantId]
        );
        return res.rows;
    }

    /**
     * Get high-level dashboard stats for a teacher
     */
    public async getTeacherDashboardStats(userId: number, tenantId: number): Promise<any> {
        // This is a complex query to get aggregate insights
        const stats = await this.db.query(
            `WITH teacher_info AS (
                SELECT id FROM school.staff WHERE user_id = $1 AND tenant_id = $2 LIMIT 1
            )
            SELECT 
                (SELECT count(DISTINCT se.student_id) FROM school.attendance a 
                 JOIN school.student_enrollment se ON a.enrollment_id = se.id
                 JOIN school.teacher_assignment ta ON se.classroom_id = ta.classroom_id
                 WHERE ta.staff_id = (SELECT id FROM teacher_info) 
                 AND a.date = CURRENT_DATE AND a.status = 'absent'
                 AND a.tenant_id = $2) as absent_today,
                
                (SELECT count(*) FROM school.exam_paper ep
                 JOIN school.teacher_assignment ta ON ep.subject_id = ta.subject_id
                 WHERE ta.staff_id = (SELECT id FROM teacher_info)
                 AND ep.exam_date >= CURRENT_DATE 
                 AND ep.exam_date <= CURRENT_DATE + INTERVAL '7 days'
                 AND ep.tenant_id = $2) as upcoming_exams,

                (SELECT count(*) FROM school.teacher_note 
                 WHERE staff_id = (SELECT id FROM teacher_info) 
                 AND created_at >= CURRENT_DATE - INTERVAL '24 hours'
                 AND tenant_id = $2) as notes_sent_24h,
                
                (SELECT COALESCE(s.attendance_mode, 'DAILY') 
                 FROM school.staff st 
                 LEFT JOIN school.settings s ON s.tenant_id = st.tenant_id 
                 WHERE st.user_id = $1 AND st.tenant_id = $2
                 LIMIT 1) as attendance_mode`,
            [userId, tenantId]
        );

        return stats.rows[0];
    }


    /**
     * Get all students in a specific classroom with their enrollment status
     */
    public async getClassroomStudents(classroomId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT s.id, s.first_name, s.last_name, s.admission_no, s.gender,
                    se.roll_number, se.status as enrollment_status
             FROM school.student s
             JOIN school.student_enrollment se ON s.id = se.student_id
             WHERE se.classroom_id = $1 AND se.status = 'active'
             ORDER BY se.roll_number::int ASC`,
            [classroomId]
        );
        return res.rows;
    }

    /**
     * Get the smart calendar (timetable) for a teacher
     */
    public async getTeacherTimetable(userId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT t.*, c.name as classroom_name, s.name as subject_name
             FROM school.timetable t
             JOIN school.staff st ON t.teacher_id = st.id
             JOIN school.classroom c ON t.classroom_id = c.id
             JOIN school.subject s ON t.subject_id = s.id
             WHERE st.user_id = $1 AND t.is_deleted = FALSE
             ORDER BY t.day_of_week, t.start_time`,
            [userId]
        );
        return res.rows;
    }

    /**
     * Get upcoming exams for subjects assigned to the teacher
     */
    public async getTeacherExams(userId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT ep.*, e.name as exam_name, s.name as subject_name, c.name as classroom_name
             FROM school.exam_paper ep
             JOIN school.exam e ON ep.exam_id = e.id
             JOIN school.subject s ON ep.subject_id = s.id
             JOIN school.exam_invitation ei ON e.id = ei.exam_id
             JOIN school.classroom c ON ei.classroom_id = c.id
             JOIN school.teacher_assignment ta ON (ta.subject_id = s.id AND ta.classroom_id = c.id)
             JOIN school.staff st ON ta.staff_id = st.id
             WHERE st.user_id = $1 AND ep.is_deleted = FALSE
             ORDER BY ep.exam_date ASC`,
            [userId]
        );
        return res.rows;
    }

    /**
     * Verify if a teacher is scheduled for this class and subject today
     */
    public async canMarkAttendance(userId: number, classroomId: number, subjectId: number): Promise<boolean> {
        const dayOfWeek = new Date().getDay() || 7; // Convert Sun=0 to 7
        const res = await this.db.query(
            `SELECT 1 FROM school.timetable t
             JOIN school.staff st ON t.teacher_id = st.id
             WHERE st.user_id = $1 
             AND t.classroom_id = $2 
             AND t.subject_id = $3 
             AND t.day_of_week = $4
             AND t.is_deleted = FALSE`,
            [userId, classroomId, subjectId, dayOfWeek]
        );
        return res.rows.length > 0;
    }
}
