import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { HomeworkService } from "../services/HomeworkService.js";
import BaseController from "../../../core/controllers/BaseController.js";

@injectable()
export class HomeworkController extends BaseController {
    constructor(private homeworkService: HomeworkService) {
        super();
    }

    async list(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;
            const filters = {
                classroomId: req.query.classroomId ? parseInt(req.query.classroomId as string) : undefined,
                subjectId: req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined,
                staffId: req.query.staffId ? parseInt(req.query.staffId as string) : undefined,
            };

            const homework = await this.homeworkService.listHomework(tenantId, userId, filters);
            return this.ok(res, "Homework retrieved", homework);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async create(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;
            const homework = await this.homeworkService.createHomework(tenantId, userId, req.body);
            return this.ok(res, "Homework created successfully", homework);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async update(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;
            const id = parseInt(req.params.id);
            const homework = await this.homeworkService.updateHomework(tenantId, userId, id, req.body);
            return this.ok(res, "Homework updated successfully", homework);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;
            const id = parseInt(req.params.id);
            await this.homeworkService.deleteHomework(tenantId, userId, id);
            return this.ok(res, "Homework deleted successfully");
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
