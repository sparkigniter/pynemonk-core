import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import SubjectService from "../services/SubjectService.js";
import BaseController from "../../../core/controllers/BaseController.js";
import { AuthenticatedRequest } from "../../../core/middleware/AuthMiddleware.js";

@injectable()
export default class SubjectController extends BaseController {
    constructor(@inject(SubjectService) private subjectService: SubjectService) {
        super();
    }

    public async list(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const filters = {
                grade_id: req.query.grade_id ? parseInt(req.query.grade_id as string) : undefined,
                search: req.query.search as string,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
            };
            const subjects = await this.subjectService.getSubjects(tenantId, filters);
            return this.ok(res, "Subjects retrieved", subjects);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async get(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const subject = await this.subjectService.getSubjectById(tenantId, id);
            if (!subject) return this.notfound(res, "Subject not found");
            return this.ok(res, "Subject details retrieved", subject);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async create(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const subject = await this.subjectService.addSubject(tenantId, req.body);
            return this.ok(res, "Subject created successfully", subject);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async update(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const subject = await this.subjectService.updateSubject(tenantId, id, req.body);
            return this.ok(res, "Subject updated successfully", subject);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async delete(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            await this.subjectService.removeSubject(tenantId, id);
            return this.ok(res, "Subject deleted successfully");
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async assignTeacher(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const assignment = await this.subjectService.assignTeacher(tenantId, req.body);
            return this.ok(res, "Teacher assigned successfully", assignment);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async bulkAssignTeachers(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const { assignments } = req.body;
            if (!Array.isArray(assignments)) {
                return this.badrequest(res, "Assignments must be an array");
            }
            const results = await this.subjectService.bulkAssignTeachers(tenantId, assignments);
            return this.ok(res, `${results.length} Teachers assigned successfully`, results);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async listAssignments(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const filters = {
                classroom_id: req.query.classroom_id ? parseInt(req.query.classroom_id as string) : undefined,
                subject_id: req.query.subject_id ? parseInt(req.query.subject_id as string) : undefined,
                staff_id: req.query.staff_id ? parseInt(req.query.staff_id as string) : undefined,
                academic_year_id: req.query.academic_year_id ? parseInt(req.query.academic_year_id as string) : undefined,
            };
            const assignments = await this.subjectService.getAssignments(tenantId, filters);
            return this.ok(res, "Assignments retrieved", assignments);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
