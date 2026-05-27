import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import BaseController from '../../../core/controllers/BaseController.js';
import { LessonPlanService } from '../services/LessonPlanService.js';

@injectable()
export class LessonPlanController extends BaseController {
    constructor(@inject(LessonPlanService) private service: LessonPlanService) {
        super();
    }

    async getLessonPlans(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const staffId = parseInt(req.query.staff_id as string);
            const startDate = req.query.start_date as string;
            const endDate = req.query.end_date as string;

            if (isNaN(staffId) || !startDate || !endDate) {
                return this.badrequest(res, "Missing or invalid required query parameters: staff_id, start_date, end_date");
            }

            const plans = await this.service.getLessonPlans(tenantId, staffId, startDate, endDate);
            return this.ok(res, "Lesson plans fetched successfully", plans);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async saveLessonPlan(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const data = req.body;
            
            if (!data.staff_id || !data.classroom_id || !data.subject_id || !data.scheduled_date || !data.period_start_time) {
                return this.badrequest(res, "Missing required fields");
            }

            const plan = await this.service.saveLessonPlan(tenantId, data);
            return this.ok(res, "Lesson plan saved successfully", plan);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
