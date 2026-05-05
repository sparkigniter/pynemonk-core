import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { ExamService } from "../services/ExamService.js";
import ResourceController from "../../../core/controllers/ResourceController.js";

@injectable()
export class ExamController extends ResourceController {
    constructor(private examService: ExamService) {
        super();
    }

    public async listExams(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const scope = await this.getScope(req);
            const academicYearId = req.query.academic_year_id ? parseInt(req.query.academic_year_id as string) : undefined;
            const classroomId = req.query.classroom_id ? parseInt(req.query.classroom_id as string) : undefined;

            let examIds: number[] | undefined;
            if (scope.accessLevel !== "FULL") {
                examIds = scope.examIds;
            }

            const exams = await this.examService.getExams(tenantId, academicYearId, examIds, classroomId);
            return this.ok(res, "Exams retrieved", exams);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async createExam(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const exam = await this.examService.addExam(tenantId, req.body);
            return this.ok(res, "Exam created successfully", exam);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async getExam(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const scope = await this.getScope(req);

            if (!scope.hasExam(id)) {
                return this.forbidden(res, "You do not have access to this exam");
            }

            const exam = await this.examService.getExamDetails(tenantId, id);
            if (!exam) return this.notfound(res, "Exam not found");
            return this.ok(res, "Exam details retrieved", exam);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async listTerms(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const academicYearId = req.query.academic_year_id ? parseInt(req.query.academic_year_id as string) : undefined;
            const terms = await this.examService.getTerms(tenantId, academicYearId);
            return this.ok(res, "Exam terms retrieved", terms);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async createTerm(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const term = await this.examService.addTerm(tenantId, req.body);
            return this.ok(res, "Exam term created successfully", term);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async addPaper(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const paper = await this.examService.addPaper(tenantId, { ...req.body, exam_id: parseInt(req.params.id) });
            return this.ok(res, "Exam paper added successfully", paper);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async deletePaper(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const paperId = parseInt(req.params.paperId);
            await this.examService.deletePaper(tenantId, paperId);
            return this.ok(res, "Exam paper deleted successfully");
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async addInvitation(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const invitation = await this.examService.addInvitation(tenantId, { ...req.body, exam_id: parseInt(req.params.id) });
            return this.ok(res, "Invitation added successfully", invitation);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async updateStudentStatus(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const examId = parseInt(req.params.id);
            const studentId = parseInt(req.params.studentId);
            const status = await this.examService.updateStudentStatus(tenantId, examId, studentId, req.body);
            return this.ok(res, "Student exam status updated", status);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async getPaperStudents(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const examId = parseInt(req.params.id);
            const paperId = parseInt(req.params.paperId);
            const scope = await this.getScope(req);
            
            let classroomIds: number[] | undefined;
            if (scope.accessLevel !== "FULL") {
                classroomIds = scope.classroomIds;
            }

            const data = await this.examService.getPaperStudents(tenantId, examId, paperId, classroomIds);
            return this.ok(res, "Paper students retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async saveMarks(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;
            const examId = parseInt(req.params.id);
            const paperId = parseInt(req.params.paperId);
            const result = await this.examService.saveMarks(tenantId, examId, paperId, req.body, userId);
            return this.ok(res, "Marks saved successfully", result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async updateStatus(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const examId = parseInt(req.params.id);
            const result = await this.examService.updateStatus(tenantId, examId, req.body.status);
            return this.ok(res, "Exam status updated", result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async updateExam(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const id = parseInt(req.params.id);
            const result = await this.examService.updateExam(tenantId, id, req.body);
            return this.ok(res, "Exam updated successfully", result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async listInvitedStudents(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const examId = parseInt(req.params.id);
            const filters = {
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
                search: req.query.search as string,
                status: req.query.status as string,
                grade_id: req.query.grade_id ? parseInt(req.query.grade_id as string) : undefined,
                classroom_id: req.query.classroom_id ? parseInt(req.query.classroom_id as string) : undefined,
                subject_id: req.query.subject_id ? parseInt(req.query.subject_id as string) : undefined
            };
            const result = await this.examService.getPaginatedStudents(tenantId, examId, filters);
            return this.ok(res, "Invited students retrieved", result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
