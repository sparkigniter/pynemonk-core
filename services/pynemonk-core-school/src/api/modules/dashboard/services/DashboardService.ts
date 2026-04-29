import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import AcademicYearHelper from "../../academics/helpers/AcademicYearHelper.js";

@injectable()
export class DashboardService {
    constructor(
        @inject("DB") private db: Pool,
        private academicYearHelper: AcademicYearHelper
    ) { }

    public async getDashboardData(tenantId: number, role: string, userId: number) {
        const currentYear = await this.academicYearHelper.findCurrent(tenantId);
        const ayId = currentYear?.id;

        switch (role.toLowerCase()) {
            case 'principal':
            case 'school_admin':
                return this.getAdminDashboard(tenantId, ayId);
            case 'teacher':
                return this.getTeacherDashboard(tenantId, ayId, userId);
            case 'student':
                return this.getStudentDashboard(tenantId, ayId, userId);
            default:
                throw new Error("Invalid role for dashboard");
        }
    }

    private async getAdminDashboard(tenantId: number, ayId?: number) {
        const stats = await this.db.query(`
            SELECT 
                (SELECT COUNT(*) FROM school.student WHERE tenant_id = $1 AND is_deleted = FALSE) as total_students,
                (SELECT COUNT(*) FROM school.staff WHERE tenant_id = $1 AND is_deleted = FALSE) as total_staff,
                (SELECT COUNT(*) FROM school.classroom WHERE tenant_id = $1 AND academic_year_id = $2 AND is_deleted = FALSE) as total_classrooms
        `, [tenantId, ayId]);

        // 2. Attendance Trends (Last 7 Days)
        const attendanceTrends = await this.db.query(`
            SELECT 
                TO_CHAR(date, 'Mon DD') as day,
                ROUND(COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as percentage
            FROM school.attendance
            WHERE tenant_id = $1 AND date > CURRENT_DATE - INTERVAL '7 days'
            GROUP BY date
            ORDER BY date ASC
        `, [tenantId]);

        // 3. Unified Activity Stream
        const activityStream = await this.db.query(`
            (SELECT 'Student Enrolled' as type, s.first_name || ' ' || s.last_name as title, g.name as subtitle, se.enrollment_date as timestamp, '🎓' as emoji, '#6366f1' as color
             FROM school.student_enrollment se 
             JOIN school.student s ON se.student_id = s.id 
             JOIN school.classroom c ON se.classroom_id = c.id
             JOIN school.grade g ON c.grade_id = g.id
             WHERE se.tenant_id = $1)
            UNION ALL
            (SELECT 'New Staff Hired' as type, first_name || ' ' || last_name, designation, created_at, '👨‍🏫', '#f59e0b'
             FROM school.staff 
             WHERE tenant_id = $1)
            UNION ALL
            (SELECT 'Exam Created' as type, name, status, created_at, '📝', '#8b5cf6'
             FROM school.exam 
             WHERE tenant_id = $1)
            ORDER BY timestamp DESC LIMIT 10
        `, [tenantId]);

        const gradePerformance = await this.db.query(`
            SELECT 
                g.name as grade_name,
                ROUND(AVG((er.marks::float / NULLIF(er.max_marks, 0)) * 100)::numeric, 1) as average_percentage
            FROM school.grade g
            JOIN school.classroom c ON g.id = c.grade_id
            JOIN school.student_enrollment se ON c.id = se.classroom_id
            JOIN school.exam_result er ON se.student_id = er.student_id
            WHERE g.tenant_id = $1 AND se.academic_year_id = $2
            GROUP BY g.id, g.name
            ORDER BY g.name
        `, [tenantId, ayId]);

        const recentExams = await this.db.query(`
            SELECT name, status, start_date as exam_date, end_date 
            FROM school.exam 
            WHERE tenant_id = $1 AND academic_year_id = $2 
            ORDER BY created_at DESC LIMIT 5
        `, [tenantId, ayId]);

        return {
            type: 'admin',
            stats: stats.rows[0],
            attendanceTrends: attendanceTrends.rows,
            activityStream: activityStream.rows,
            upcomingExams: recentExams.rows, // Map recent exams to upcomingExams for simplicity in UI
            insights: {
                gradePerformance: gradePerformance.rows,
                recentExams: recentExams.rows
            }
        };
    }

    private async getTeacherDashboard(tenantId: number, ayId: number | undefined, userId: number) {
        const staffRes = await this.db.query('SELECT id FROM school.staff WHERE user_id = $1 AND tenant_id = $2', [userId, tenantId]);
        const staffId = staffRes.rows[0]?.id;

        const myClasses = await this.db.query(`
            SELECT c.id, c.name, c.section, g.name as grade_name
            FROM school.classroom c
            JOIN school.grade g ON c.grade_id = g.id
            WHERE c.class_teacher_id = $1 AND c.academic_year_id = $2 AND c.is_deleted = FALSE
        `, [staffId, ayId]);

        const upcomingExams = await this.db.query(`
            SELECT name, start_date as exam_date, exam_type
            FROM school.exam
            WHERE tenant_id = $1 AND academic_year_id = $2 AND start_date >= NOW()
            ORDER BY start_date ASC LIMIT 5
        `, [tenantId, ayId]);

        return {
            type: 'teacher',
            stats: {
                classCount: myClasses.rows.length,
            },
            myClasses: myClasses.rows,
            upcomingExams: upcomingExams.rows
        };
    }

    private async getStudentDashboard(tenantId: number, ayId: number | undefined, userId: number) {
        const studentRes = await this.db.query('SELECT id FROM school.student WHERE user_id = $1 AND tenant_id = $2', [userId, tenantId]);
        const studentId = studentRes.rows[0]?.id;

        const performance = await this.db.query(`
            SELECT 
                s.name as subject_name,
                ROUND(AVG((er.marks::float / NULLIF(er.max_marks, 0)) * 100)::numeric, 1) as average
            FROM school.exam_result er
            JOIN school.subject s ON er.subject_id = s.id
            WHERE er.student_id = $1 AND er.tenant_id = $2
            GROUP BY s.id, s.name
        `, [studentId, tenantId]);

        const nextExams = await this.db.query(`
            SELECT name, start_date as exam_date, exam_type
            FROM school.exam
            WHERE tenant_id = $1 AND academic_year_id = $2 AND start_date >= NOW()
            ORDER BY start_date ASC LIMIT 3
        `, [tenantId, ayId]);

        return {
            type: 'student',
            performance: performance.rows,
            upcomingExams: nextExams.rows
        };
    }
}

export default DashboardService;
