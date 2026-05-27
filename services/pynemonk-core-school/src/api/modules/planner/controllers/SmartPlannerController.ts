import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import BaseController from '../../../core/controllers/BaseController.js';
import { SmartPlannerService } from '../services/SmartPlannerService.js';

@injectable()
export class SmartPlannerController extends BaseController {
    constructor(private service: SmartPlannerService) {
        super();
    }

    async getTemplates(req: Request, res: Response) {
        try {
            const boardName = req.query.board_name as string;
            const gradeName = req.query.grade_name as string;
            const subjectName = req.query.subject_name as string;
            const search = req.query.search as string;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
            
            const result = await this.service.getGlobalSyllabi({
                boardName,
                gradeName,
                subjectName,
                search,
                limit,
                offset
            });
            return this.ok(res, "Templates retrieved", result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async subscribe(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const { academic_year_id, school_subject_id, classroom_id, teacher_id, global_syllabus_id } = req.body;

            if (!academic_year_id || !school_subject_id || !classroom_id || !global_syllabus_id) {
                return this.badrequest(res, "Missing required parameters for subscription");
            }

            // 1. Subscribe
            const subscription = await this.service.subscribeToGlobalSyllabus(
                tenantId, 
                parseInt(academic_year_id), 
                parseInt(school_subject_id), 
                parseInt(global_syllabus_id)
            );

            // 2. Generate Plan
            const planResult = await this.service.generateAutoPlan(
                tenantId,
                parseInt(classroom_id),
                parseInt(teacher_id), // Can be null if just subscribing
                subscription.id
            );

            // Fetch the generated plan details to return to frontend
            const fullPlanDetails = await this.service.getPlanDetails(tenantId, planResult.planId);

            return this.ok(res, "Subscribed and auto-scheduled successfully", fullPlanDetails);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async getPlanDetails(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const planId = parseInt(req.params.id);
            const details = await this.service.getPlanDetails(tenantId, planId);
            return this.ok(res, "Plan retrieved", details);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async getPlanByClassroomAndSubject(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const classroomId = parseInt(req.query.classroom_id as string);
            const subjectId = parseInt(req.query.subject_id as string);

            if (!classroomId || !subjectId) {
                return this.badrequest(res, "Missing classroom_id or subject_id");
            }

            const details = await this.service.getPlanByClassroomAndSubject(tenantId, classroomId, subjectId);
            return this.ok(res, "Plan retrieved", details);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async getTemplateDetails(req: Request, res: Response) {
        try {
            const templateId = parseInt(req.params.id);
            if (isNaN(templateId)) {
                return this.badrequest(res, "Invalid template ID");
            }
            const details = await this.service.getGlobalSyllabusDetails(templateId);
            if (!details) {
                return this.notfound(res, "Template not found");
            }
            return this.ok(res, "Template details retrieved", details);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async getTaxonomy(req: Request, res: Response) {
        try {
            const result = await this.service.getGlobalTaxonomy();
            return this.ok(res, "Global taxonomy retrieved", result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async updatePlannedSession(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const sessionId = parseInt(req.params.id);
            if (isNaN(sessionId)) {
                return this.badrequest(res, "Invalid session ID");
            }
            const updated = await this.service.updatePlannedSession(tenantId, sessionId, req.body);
            if (!updated) {
                return this.notfound(res, "Planned session not found");
            }
            return this.ok(res, "Planned session updated successfully", updated);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
