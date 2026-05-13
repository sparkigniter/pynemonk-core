import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import AcademicYearHelper from "../../academics/helpers/AcademicYearHelper.js";
import { Logger } from "../../../core/utils/Logger.js";

@injectable()
export class DashboardService {
    constructor(
        @inject("DB") private db: Pool,
        private academicYearHelper: AcademicYearHelper
    ) { }

    public async getDashboardData(tenantId: number, role: string, userId: number, data: any = {}) {
        const currentYear = await this.academicYearHelper.findCurrent(tenantId);
        const ayId = currentYear?.id;
        
        Logger.info(`Dashboard data requested`, { tenantId, role, userId, academicYearId: ayId });

        switch (role.toLowerCase()) {
            case 'principal':
            case 'school_admin':
                return this.getAdminDashboard(tenantId, ayId, parseInt(data.days || '7'));
            case 'teacher':
                return this.getTeacherDashboard(tenantId, ayId, userId, parseInt(data.days || '7'));
            case 'student':
                return this.getStudentDashboard(tenantId, ayId, userId);
            case 'guardian':
            case 'parent':
                return this.getParentDashboard(tenantId, ayId, userId);
            default:
                throw new Error("Invalid role for dashboard");
        }
    }

    private async getAdminDashboard(tenantId: number, ayId?: number, days: number = 7) {
        const stats = await this.db.query(`
            SELECT 
                (SELECT COUNT(*) FROM school.student WHERE tenant_id = $1 AND is_deleted = FALSE) as total_students,
                (SELECT COUNT(*) FROM school.staff WHERE tenant_id = $1 AND is_deleted = FALSE) as total_staff,
                (SELECT COUNT(*) FROM school.classroom WHERE tenant_id = $1 AND academic_year_id = $2 AND is_deleted = FALSE) as total_classrooms,
                (SELECT COUNT(*) FROM school.subject WHERE tenant_id = $1 AND is_deleted = FALSE) as total_subjects
        `, [tenantId, ayId]);

        // 2. Attendance Trends (Last 7 Days)
        const attendanceTrends = await this.db.query(`
            SELECT 
                TO_CHAR(date, 'Mon DD') as day,
                ROUND(COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / NULLIF((SELECT COUNT(*) FROM school.student_enrollment WHERE tenant_id = $1 AND academic_year_id = $2 AND is_deleted = FALSE), 0), 1) as percentage
            FROM school.attendance
            WHERE tenant_id = $1 AND date > CURRENT_DATE - ($3 || ' days')::interval
            GROUP BY date
            ORDER BY date ASC
        `, [tenantId, ayId, days]);

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

        const staffOnLeave = await this.db.query(`
            SELECT s.first_name || ' ' || s.last_name as name, sl.leave_type
            FROM school.staff_leave sl
            JOIN school.staff s ON sl.staff_id = s.id
            WHERE sl.tenant_id = $1 AND CURRENT_DATE BETWEEN sl.start_date AND sl.end_date AND sl.status = 'approved'
        `, [tenantId]);

        const recentAdmissions = await this.db.query(`
            SELECT s.first_name || ' ' || s.last_name as name, g.name as grade, se.enrollment_date
            FROM school.student_enrollment se
            JOIN school.student s ON se.student_id = s.id
            JOIN school.classroom c ON se.classroom_id = c.id
            JOIN school.grade g ON c.grade_id = g.id
            WHERE se.tenant_id = $1 AND se.academic_year_id = $2 AND se.enrollment_date > CURRENT_DATE - INTERVAL '30 days'
            ORDER BY se.enrollment_date DESC LIMIT 5
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
            upcomingExams: recentExams.rows,
            insights: {
                gradePerformance: gradePerformance.rows,
                staffOnLeave: staffOnLeave.rows,
                recentAdmissions: recentAdmissions.rows
            }
        };
    }

    private async getTeacherDashboard(tenantId: number, ayId: number | undefined, userId: number, days: number = 7) {
        const staffRes = await this.db.query('SELECT id FROM school.staff WHERE user_id = $1 AND tenant_id = $2', [userId, tenantId]);
        const staffId = staffRes.rows[0]?.id;

        const myClasses = await this.db.query(`
            SELECT c.id, c.name, c.section, g.name as grade_name
            FROM school.classroom c
            JOIN school.grade g ON c.grade_id = g.id
            WHERE c.class_teacher_id = $1 AND c.academic_year_id = $2 AND c.is_deleted = FALSE
        `, [staffId, ayId]);

        // Fetch Today's Timetable for this teacher
        const dayOfWeek = new Date().getDay() || 7;
        const todaySchedule = await this.db.query(`
            SELECT t.*, c.name as classroom_name, s.name as subject_name, g.name as grade_name,
                   (SELECT COUNT(*) FROM school.attendance a 
                    WHERE a.enrollment_id IN (SELECT id FROM school.student_enrollment WHERE classroom_id = t.classroom_id)
                    AND a.date = CURRENT_DATE) > 0 as attendance_taken
            FROM school.timetable t
            JOIN school.classroom c ON t.classroom_id = c.id
            JOIN school.grade g ON c.grade_id = g.id
            JOIN school.subject s ON t.subject_id = s.id
            WHERE t.tenant_id = $1 AND t.teacher_id = $2 AND t.day_of_week = $3 
              AND t.academic_year_id = $4 AND t.is_deleted = FALSE
            ORDER BY t.start_time
        `, [tenantId, staffId, dayOfWeek, ayId]);

        const upcomingExams = await this.db.query(`
            SELECT e.name, ep.exam_date, s.name as subject_name
            FROM school.exam_paper ep
            JOIN school.exam e ON ep.exam_id = e.id
            JOIN school.subject s ON ep.subject_id = s.id
            JOIN school.teacher_assignment ta ON s.id = ta.subject_id
            WHERE ep.tenant_id = $1 AND e.academic_year_id = $2 AND ep.exam_date >= CURRENT_DATE AND ta.staff_id = $3
            ORDER BY ep.exam_date ASC LIMIT 5
        `, [tenantId, ayId, staffId]);

        const urgentMarking = await this.db.query(`
            SELECT e.name as exam_name, s.name as subject_name, ep.exam_date, ep.id as paper_id,
                   (SELECT COUNT(*) FROM school.exam_student es WHERE es.exam_id = e.id) as total_students,
                   (SELECT COUNT(*) FROM school.exam_marks em WHERE em.paper_id = ep.id) as marked_students
            FROM school.exam_paper ep
            JOIN school.exam e ON ep.exam_id = e.id
            JOIN school.subject s ON ep.subject_id = s.id
            JOIN school.teacher_assignment ta ON s.id = ta.subject_id
            WHERE ep.tenant_id = $1 AND ta.staff_id = $2 AND ep.exam_date < CURRENT_DATE
            AND (SELECT COUNT(*) FROM school.exam_marks em WHERE em.paper_id = ep.id) < (SELECT COUNT(*) FROM school.exam_student es WHERE es.exam_id = e.id)
            ORDER BY ep.exam_date DESC LIMIT 3
        `, [tenantId, staffId]);

        const teacherStats = await this.db.query(`
            SELECT 
                (SELECT COUNT(*) FROM school.student_enrollment WHERE classroom_id IN (SELECT id FROM school.classroom WHERE class_teacher_id = $1)) as my_students_count,
                (SELECT COUNT(*) FROM school.homework WHERE staff_id = $1 AND is_deleted = FALSE) as my_homework_count,
                (SELECT COUNT(*) FROM school.teacher_assignment WHERE staff_id = $1 AND is_deleted = FALSE) as my_subjects_count
        `, [staffId]);

        const allAssignments = await this.db.query(`
            SELECT ta.id, ta.classroom_id, ta.subject_id, c.name as classroom_name, c.section, s.name as subject_name, s.code as subject_code,
                   (SELECT COUNT(*) FROM school.student_enrollment WHERE classroom_id = ta.classroom_id AND is_deleted = FALSE) as student_count
            FROM school.teacher_assignment ta
            JOIN school.classroom c ON ta.classroom_id = c.id
            JOIN school.subject s ON ta.subject_id = s.id
            WHERE ta.staff_id = $1 AND ta.academic_year_id = $2 AND ta.is_deleted = FALSE
        `, [staffId, ayId]);

        return {
            type: 'teacher',
            stats: {
                classCount: myClasses.rows.length,
                ...teacherStats.rows[0]
            },
            myClasses: myClasses.rows,
            todaySchedule: todaySchedule.rows,
            allAssignments: allAssignments.rows,
            upcomingExams: upcomingExams.rows,
            insights: {
                urgentMarking: urgentMarking.rows
            }
        };
    }

    private async getParentDashboard(tenant_id: number, ayId: number | undefined, userId: number) {
        const guardianRes = await this.db.query('SELECT id FROM school.guardian WHERE user_id = $1 AND tenant_id = $2', [userId, tenant_id]);
        const guardianId = guardianRes.rows[0]?.id;

        if (!guardianId) {
            return {
                type: 'parent',
                children: [],
                stats: { childCount: 0 }
            };
        }
        const children = await this.db.query(`
            SELECT s.id, s.first_name || ' ' || s.last_name as name, c.name as classroom_name, g.name as grade_name
            FROM school.student s
            JOIN school.student_guardian sg ON s.id = sg.student_id
            JOIN school.student_enrollment se ON s.id = se.student_id
            JOIN school.classroom c ON se.classroom_id = c.id
            JOIN school.grade g ON c.grade_id = g.id
            WHERE sg.guardian_id = $1 AND s.tenant_id = $2 AND se.academic_year_id = $3
        `, [guardianId, tenant_id, ayId]);

        const childrenPerformance = await this.db.query(`
            SELECT s.id as student_id, s.first_name || ' ' || s.last_name as student_name,
                   sub.name as subject_name, ROUND(AVG((em.marks_obtained/ep.max_marks)*100), 1) as score
            FROM school.student s
            JOIN school.student_guardian sg ON s.id = sg.student_id
            JOIN school.exam_marks em ON s.id = em.student_id
            JOIN school.exam_paper ep ON em.paper_id = ep.id
            JOIN school.exam e ON ep.exam_id = e.id
            JOIN school.subject sub ON ep.subject_id = sub.id
            WHERE sg.guardian_id = $1 AND s.tenant_id = $2 AND e.results_published = TRUE
            GROUP BY s.id, s.first_name, s.last_name, sub.name
        `, [guardianId, tenant_id]);

        const nextExams = await this.db.query(`
            SELECT s.first_name as student_name, e.name as exam_name, ep.exam_date, sub.name as subject_name
            FROM school.student s
            JOIN school.student_guardian sg ON s.id = sg.student_id
            JOIN school.exam_student es ON s.id = es.student_id
            JOIN school.exam e ON es.exam_id = e.id
            JOIN school.exam_paper ep ON e.id = ep.exam_id
            JOIN school.subject sub ON ep.subject_id = sub.id
            WHERE sg.guardian_id = $1 AND s.tenant_id = $2 AND ep.exam_date >= CURRENT_DATE
            ORDER BY ep.exam_date ASC LIMIT 3
        `, [guardianId, tenant_id]);

        return {
            type: 'parent',
            children: children.rows,
            stats: {
                childCount: children.rows.length
            },
            insights: {
                performance: childrenPerformance.rows,
                upcomingExams: nextExams.rows
            }
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
            JOIN school.exam e ON er.exam_id = e.id
            WHERE er.student_id = $1 AND er.tenant_id = $2 AND e.results_published = TRUE
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
