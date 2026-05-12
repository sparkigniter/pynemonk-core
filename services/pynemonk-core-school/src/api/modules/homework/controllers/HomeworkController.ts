import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { HomeworkService } from "../services/HomeworkService.js";
import ResourceController from "../../../core/controllers/ResourceController.js";

@injectable()
export class HomeworkController extends ResourceController {
    constructor(private homeworkService: HomeworkService) {
        super();
    }

    async getById(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const id = parseInt(req.params.id);
            const scope = await this.getScope(req);
            
            const homework = await this.homeworkService.getHomeworkById(tenantId, (req as any).user.userId, id);
            
            if (!scope.hasClassroom(homework.classroom_id)) {
                return this.forbidden(res, "You do not have access to this homework");
            }

            return this.ok(res, "Homework retrieved", homework);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async list(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;
            const scope = await this.getScope(req);
            
            const filters: any = {
                classroomId: req.query.classroomId ? parseInt(req.query.classroomId as string) : undefined,
                subjectId: req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined,
                staffId: req.query.staffId ? parseInt(req.query.staffId as string) : undefined,
            };

            // Enforce scope
            if (scope.accessLevel !== "FULL") {
                if (filters.classroomId && !scope.hasClassroom(filters.classroomId)) {
                    return this.forbidden(res, "You do not have access to this classroom");
                }
                // If no classroom specified, filter by all assigned classrooms
                if (!filters.classroomId) {
                    filters.classroomIds = scope.classroomIds;
                }
                if (filters.staffId && !scope.hasStaff(filters.staffId)) {
                    return this.forbidden(res, "You do not have access to this staff member's homework");
                }
            }

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
