import { injectable, inject } from 'tsyringe';
import { Pool } from 'pg';
import { Logger } from '../../../core/utils/Logger.js';

@injectable()
export class ReportCardService {
    constructor(@inject('DB') private pool: Pool) {}

    /**
     * Aggregates all marks for a student in a specific exam to generate a report card
     */
    async getReportCardData(tenantId: number, examId: number, studentId: number) {
        const query = `
            SELECT 
                s.first_name, s.last_name, s.admission_number,
                c.name as classroom_name,
                g.name as grade_name,
                e.name as exam_name,
                e.exam_type,
                sub.name as subject_name,
                sub.code as subject_code,
                ep.max_marks,
                ep.passing_marks,
                em.marks_obtained,
                em.is_absent,
                em.remarks,
                ay.name as academic_year
            FROM school.student s
            JOIN school.student_enrollment se ON s.id = se.student_id
            JOIN school.classroom c ON se.classroom_id = c.id
            JOIN school.grade g ON c.grade_id = g.id
            JOIN school.academic_year ay ON se.academic_year_id = ay.id
            CROSS JOIN school.exam e
            JOIN school.exam_paper ep ON e.id = ep.exam_id
            JOIN school.subject sub ON ep.subject_id = sub.id
            LEFT JOIN school.exam_marks em ON ep.id = em.paper_id AND em.student_id = s.id
            WHERE s.tenant_id = $1 AND e.id = $2 AND s.id = $3
              AND se.is_active = TRUE
        `;
        
        const res = await this.pool.query(query, [tenantId, examId, studentId]);
        
        if (res.rows.length === 0) return null;

        const first = res.rows[0];
        const report = {
            student: {
                id: studentId,
                name: `${first.first_name} ${first.last_name}`,
                admission_no: first.admission_number,
                classroom: first.classroom_name,
                grade: first.grade_name,
                academic_year: first.academic_year
            },
            exam: {
                id: examId,
                name: first.exam_name,
                type: first.exam_type
            },
            subjects: res.rows.map(r => ({
                name: r.subject_name,
                code: r.subject_code,
                max: r.max_marks,
                passing: r.passing_marks,
                obtained: r.marks_obtained || 0,
                is_absent: r.is_absent,
                remarks: r.remarks,
                status: r.is_absent ? 'ABSENT' : (r.marks_obtained >= r.passing_marks ? 'PASS' : 'FAIL')
            })),
            summary: {
                total_max: 0,
                total_obtained: 0,
                percentage: 0,
                result: 'PASS'
            }
        };

        // Calculate Totals
        report.summary.total_max = report.subjects.reduce((sum, s) => sum + Number(s.max), 0);
        report.summary.total_obtained = report.subjects.reduce((sum, s) => sum + Number(s.obtained), 0);
        report.summary.percentage = Number(((report.summary.total_obtained / report.summary.total_max) * 100).toFixed(2));
        
        if (report.subjects.some(s => s.status === 'FAIL')) {
            report.summary.result = 'FAIL';
        }

        return report;
    }

    /**
     * Get all report cards for a specific classroom and exam
     */
    async getClassroomReportCards(tenantId: number, examId: number, classroomId: number) {
        // First get all students in the classroom
        const studentsQuery = `
            SELECT s.id 
            FROM school.student s
            JOIN school.student_enrollment se ON s.id = se.student_id
            WHERE s.tenant_id = $1 AND se.classroom_id = $2 AND se.is_active = TRUE
        `;
        const studentRes = await this.pool.query(studentsQuery, [tenantId, classroomId]);
        
        const reportCards = [];
        for (const student of studentRes.rows) {
            const data = await this.getReportCardData(tenantId, examId, student.id);
            if (data) reportCards.push(data);
        }
        
        return reportCards;
    }
}
