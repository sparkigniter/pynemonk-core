import { injectable, inject } from "tsyringe";
import { ExamHelper } from "../helpers/ExamHelper.js";
import AcademicYearHelper from "../../academics/helpers/AcademicYearHelper.js";

@injectable()
export class ExamService {
    constructor(
        private examHelper: ExamHelper,
        private academicYearHelper: AcademicYearHelper
    ) { }

    // ─── Terms ───────────────────────────────────────────────────────────────

    public async getTerms(tenantId: number, academicYearId?: number) {
        if (!academicYearId) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            academicYearId = currentYear?.id;
        }
        if (!academicYearId) throw new Error("No active academic year found");
        return this.examHelper.findAllTerms(tenantId, academicYearId);
    }

    public async addTerm(tenantId: number, data: any) {
        if (!data.academic_year_id) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            data.academic_year_id = currentYear?.id;
        }
        if (!data.academic_year_id) throw new Error("No active academic year found");
        return this.examHelper.createTerm({ ...data, tenant_id: tenantId });
    }

    // ─── Exams ───────────────────────────────────────────────────────────────

    public async getExams(tenantId: number, academicYearId?: number, examIds?: number[], classroomId?: number) {
        if (!academicYearId) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            academicYearId = currentYear?.id;
        }
        if (!academicYearId) throw new Error("No active academic year found");
        return this.examHelper.findAllExams(tenantId, academicYearId, examIds, classroomId);
    }

    public async addExam(tenantId: number, data: any) {
        if (!data.academic_year_id) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            data.academic_year_id = currentYear?.id;
        }
        if (!data.academic_year_id) throw new Error("No active academic year found");

        const exam = await this.examHelper.createExam({ ...data, tenant_id: tenantId });

        // If invitations (grades/classrooms) are provided during creation, add them
        if (data.invitations && Array.isArray(data.invitations)) {
            for (const inv of data.invitations) {
                await this.examHelper.createInvitation({
                    ...inv,
                    tenant_id: tenantId,
                    exam_id: exam.id
                });
            }
        }

        return exam;
    }

    public async getExamDetails(tenantId: number, id: number) {
        const exam = await this.examHelper.findById(tenantId, id);
        if (!exam) return null;

        const papers = await this.examHelper.findPapersByExam(tenantId, id);
        const invitations = await this.examHelper.findInvitationsByExam(tenantId, id);
        const students = await this.examHelper.getInvitedStudents(tenantId, id);

        return { ...exam, papers, invitations, students };
    }

    // ─── Papers & Invitations ───────────────────────────────────────────────

    public async addPaper(tenantId: number, data: any) {
        if (data.id) {
            return this.examHelper.updatePaper(tenantId, data.id, data);
        }
        return this.examHelper.createPaper({ ...data, tenant_id: tenantId });
    }

    public async deletePaper(tenantId: number, paperId: number) {
        return this.examHelper.deletePaper(tenantId, paperId);
    }

    public async addInvitation(tenantId: number, data: any) {
        return this.examHelper.createInvitation({ ...data, tenant_id: tenantId });
    }

    public async updateStudentStatus(tenantId: number, examId: number, studentId: number, data: any) {
        return this.examHelper.upsertExamStudent({
            ...data,
            tenant_id: tenantId,
            exam_id: examId,
            student_id: studentId
        });
    }

    public async getPaperStudents(tenantId: number, examId: number, paperId: number, classroomIds?: number[]) {
        const students = await this.examHelper.getInvitedStudents(tenantId, examId, paperId, classroomIds);
        const marks = await this.examHelper.getMarksByPaper(tenantId, paperId);

        // Map marks to students
        return students.map((s: any) => ({
            ...s,
            marks: marks.find((m: any) => m.student_id === s.student_id) || null
        }));
    }

    public async getPaginatedStudents(tenantId: number, examId: number, filters: any) {
        return this.examHelper.getPaginatedInvitedStudents(tenantId, examId, filters);
    }

    public async saveMarks(tenantId: number, examId: number, paperId: number, marksData: any[], userId: number) {
        for (const item of marksData) {
            await this.examHelper.saveMarks(tenantId, {
                ...item,
                exam_id: examId,
                paper_id: paperId,
                created_by: userId
            });
        }
        return { success: true };
    }

    public async updateStatus(tenantId: number, examId: number, status: string) {
        return this.examHelper.updateExamStatus(tenantId, examId, status);
    }

    public async updateExam(tenantId: number, id: number, data: any) {
        return this.examHelper.updateExam(tenantId, id, data);
    }

    public async getExamResults(tenantId: number, examId: number) {
        return this.examHelper.getExamResults(tenantId, examId);
    }

    public async getDashboardStats(tenantId: number, userId: number, examIds?: number[]) {
        return this.examHelper.getExamDashboardStats(tenantId, undefined, examIds); // Base version, controller can pass staffId if needed
    }

    public async getStudentPerformance(tenantId: number, studentId: number) {
        // Fetch all marks for this student
        const query = `
            SELECT 
                COALESCE(ay.name, 'Unknown Year') as academic_year,
                COALESCE(et.name, 'General') as term_name,
                e.name as exam_name,
                e.exam_type,
                s.name as subject_name,
                s.code as subject_code,
                ep.max_marks,
                ep.passing_marks,
                em.marks_obtained,
                em.is_absent
            FROM school.exam_marks em
            JOIN school.exam e ON em.exam_id = e.id
            JOIN school.exam_paper ep ON em.paper_id = ep.id
            JOIN school.subject s ON ep.subject_id = s.id
            LEFT JOIN school.exam_term et ON e.exam_term_id = et.id
            LEFT JOIN school.academic_year ay ON e.academic_year_id = ay.id
            WHERE em.tenant_id = $1 AND em.student_id = $2 AND e.is_deleted = FALSE
            ORDER BY ay.start_date DESC, et.created_at DESC, e.start_date DESC
        `;
        const res = await (this.examHelper as any).db.query(query, [tenantId, studentId]);
        
        // Group by Academic Year
        const performance: any = {};
        res.rows.forEach((row: any) => {
            if (!performance[row.academic_year]) {
                performance[row.academic_year] = {
                    year: row.academic_year,
                    terms: {}
                };
            }
            if (!performance[row.academic_year].terms[row.term_name]) {
                performance[row.academic_year].terms[row.term_name] = {
                    name: row.term_name,
                    exams: {}
                };
            }
            if (!performance[row.academic_year].terms[row.term_name].exams[row.exam_name]) {
                performance[row.academic_year].terms[row.term_name].exams[row.exam_name] = {
                    name: row.exam_name,
                    type: row.exam_type,
                    subjects: []
                };
            }
            performance[row.academic_year].terms[row.term_name].exams[row.exam_name].subjects.push({
                subject: row.subject_name,
                code: row.subject_code,
                marks: row.marks_obtained,
                max: row.max_marks,
                passing: row.passing_marks,
                is_absent: row.is_absent
            });
        });

        return Object.values(performance);
    }
}
