import { injectable, inject } from "tsyringe";
import { ExamHelper } from "../helpers/ExamHelper.js";
import AcademicYearHelper from "../../academics/helpers/AcademicYearHelper.js";

@injectable()
export class ExamService {
    constructor(
        private examHelper: ExamHelper,
        private academicYearHelper: AcademicYearHelper
    ) {}

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

    public async getExams(tenantId: number, academicYearId?: number) {
        if (!academicYearId) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            academicYearId = currentYear?.id;
        }
        if (!academicYearId) throw new Error("No active academic year found");
        return this.examHelper.findAllExams(tenantId, academicYearId);
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
        return this.examHelper.createPaper({ ...data, tenant_id: tenantId });
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

    public async getPaperStudents(tenantId: number, examId: number, paperId: number) {
        const students = await this.examHelper.getInvitedStudents(tenantId, examId);
        const marks = await this.examHelper.getMarksByPaper(tenantId, paperId);

        // Map marks to students
        return students.map((s: any) => ({
            ...s,
            marks: marks.find((m: any) => m.student_id === s.student_id) || null
        }));
    }

    public async saveMarks(tenantId: number, examId: number, paperId: number, marksData: any[]) {
        for (const item of marksData) {
            await this.examHelper.saveMarks(tenantId, {
                ...item,
                exam_id: examId,
                paper_id: paperId
            });
        }
        return { success: true };
    }

    public async updateStatus(tenantId: number, examId: number, status: string) {
        return this.examHelper.updateExamStatus(tenantId, examId, status);
    }
}
