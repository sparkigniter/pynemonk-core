import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import BaseController from '../../../core/controllers/BaseController.js';
import { AcademicPlannerService } from '../services/AcademicPlannerService.js';

@injectable()
export class AcademicPlannerController extends BaseController {
    constructor(private service: AcademicPlannerService) {
        super();
    }

    async listPlanners(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const planners = await this.service.listPlanners(tenantId, req.query);
            return this.ok(res, "Planners retrieved", planners);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async getPlannerByTeacherAndSubject(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const staffId = parseInt(req.query.staff_id as string);
            const subjectId = parseInt(req.query.subject_id as string);
            const gradeId = parseInt(req.query.grade_id as string);

            if (!staffId || !subjectId || !gradeId) {
                return this.badrequest(res, "Missing parameters");
            }

            const planner = await this.service.getPlannerByTeacherAndSubject(tenantId, staffId, subjectId, gradeId);
            return this.ok(res, "Planner retrieved", planner);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async createPlanner(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const planner = await this.service.createPlanner(tenantId, req.body);
            return this.ok(res, "Planner created successfully", planner);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async getPlannerDetails(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const details = await this.service.getPlannerDetails(tenantId, id);
            if (!details) return this.notfound(res, "Planner not found");
            return this.ok(res, "Planner details retrieved", details);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async addChapter(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const plannerId = parseInt(req.params.id);
            const chapter = await this.service.addChapter(tenantId, plannerId, req.body);
            return this.ok(res, "Chapter added successfully", chapter);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async updateChapter(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const chapterId = parseInt(req.params.id);
            const chapter = await this.service.updateChapter(tenantId, chapterId, req.body);
            return this.ok(res, "Chapter updated successfully", chapter);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async addMilestone(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const plannerId = parseInt(req.params.id);
            const milestone = await this.service.addMilestone(tenantId, plannerId, req.body);
            return this.ok(res, "Milestone added successfully", milestone);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async autoSchedulePlanner(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const plannerId = parseInt(req.params.id);
            const details = await this.service.autoSchedulePlanner(tenantId, plannerId);
            return this.ok(res, "Planner scheduled successfully", details);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
