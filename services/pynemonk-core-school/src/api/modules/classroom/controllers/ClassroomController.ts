import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import ClassroomService from "../services/ClassroomService.js";
import BaseController from "../../../core/controllers/BaseController.js";

@injectable()
export default class ClassroomController extends BaseController {
    constructor(@inject(ClassroomService) private classroomService: ClassroomService) {
        super();
    }

    public async list(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const filters = {
                academic_year_id: req.query.academic_year_id ? parseInt(req.query.academic_year_id as string) : undefined,
                grade_id: req.query.grade_id ? parseInt(req.query.grade_id as string) : undefined,
                search: req.query.search as string,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
            };
            const classrooms = await this.classroomService.getClassrooms(tenantId, filters);
            return this.ok(res, "Classrooms retrieved", classrooms);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async get(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const id = parseInt(req.params.id);
            const classroom = await this.classroomService.getClassroomById(tenantId, id);
            if (!classroom) return this.notfound(res, "Classroom not found");
            return this.ok(res, "Classroom details retrieved", classroom);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async create(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const classroom = await this.classroomService.addClassroom(tenantId, req.body);
            return this.ok(res, "Classroom created successfully", classroom);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const id = parseInt(req.params.id);
            const classroom = await this.classroomService.updateClassroom(tenantId, id, req.body);
            return this.ok(res, "Classroom updated successfully", classroom);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const id = parseInt(req.params.id);
            await this.classroomService.removeClassroom(tenantId, id);
            return this.ok(res, "Classroom deleted successfully");
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
