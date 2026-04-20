import { Response } from "express";
import { injectable, inject } from "tsyringe";
import BaseController from "../../../core/controllers/BaseController.js";
import CourseService from "../services/CourseService.js";
import { AuthenticatedRequest } from "../../../core/middleware/AuthMiddleware.js";

@injectable()
export default class CourseController extends BaseController {
    constructor(@inject(CourseService) private courseService: CourseService) {
        super();
    }

    public list = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = this.getTenantId(req);
            const courses = await this.courseService.getCourseList(tenantId);
            return this.ok(res, "Courses retrieved successfully", courses);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public get = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const course = await this.courseService.getCourseById(tenantId, id);
            if (!course) return this.notfound(res, "Course not found");
            return this.ok(res, "Course retrieved successfully", course);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = this.getTenantId(req);
            const course = await this.courseService.addCourse(tenantId, req.body);
            return this.ok(res, "Course created successfully", course);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const course = await this.courseService.updateCourse(tenantId, id, req.body);
            return this.ok(res, "Course updated successfully", course);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            await this.courseService.removeCourse(tenantId, id);
            return this.ok(res, "Course deleted successfully");
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
