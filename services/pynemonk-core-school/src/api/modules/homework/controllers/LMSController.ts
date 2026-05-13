import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import BaseController from '../../../core/controllers/BaseController.js';
import { LMSService } from '../services/LMSService.js';

@injectable()
export class LMSController extends BaseController {
    constructor(private lmsService: LMSService) {
        super();
    }

    async getResources(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const resources = await this.lmsService.listResources(tenantId, req.query);
            return this.ok(res, "Resources retrieved", resources);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async createResource(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const userId = this.getUserId(req);
            const resource = await this.lmsService.createResource(tenantId, req.body, userId);
            return this.ok(res, "Resource created", resource);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async submitAssignment(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const studentId = (req as any).user.student_profile?.id;
            if (!studentId) return this.forbidden(res, "Only students can submit assignments");

            const submission = await this.lmsService.submitAssignment(tenantId, studentId, req.body);
            return this.ok(res, "Assignment submitted successfully", submission);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async gradeSubmission(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const teacherUserId = this.getUserId(req);
            const submissionId = parseInt(req.params.id);
            const submission = await this.lmsService.gradeSubmission(tenantId, submissionId, req.body, teacherUserId);
            return this.ok(res, "Submission graded", submission);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async getSubmissionsForHomework(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const homeworkId = parseInt(req.params.homeworkId);
            const submissions = await this.lmsService.getSubmissionsForHomework(tenantId, homeworkId);
            return this.ok(res, "Submissions retrieved", submissions);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
