import { Response } from "express";
import { injectable, inject } from "tsyringe";
import ResourceController from "../../../core/controllers/ResourceController.js";
import CourseService from "../services/CourseService.js";
import { AuthenticatedRequest } from "../../../core/middleware/AuthMiddleware.js";
import { AccessLevel } from "../../../core/helpers/DataScopeHelper.js";

@injectable()
export default class CourseController extends ResourceController {
    constructor(@inject(CourseService) private courseService: CourseService) {
        super();
    }

    public list = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = this.getTenantId(req);
            const scope = await this.getScope(req);
            const { page, limit, search } = req.query;

            const filters: any = {
                page: page ? parseInt(page as string, 10) : 1,
                limit: limit ? parseInt(limit as string, 10) : 10,
                search: search as string,
            };

            // Courses are usually school-wide, but we might want to restrict view if needed.
            // For now, let's keep it open or restrict to ASSIGNED if there's a mapping.
            // Since courses are often global, we'll keep them visible but restrict modifications.

            const courses = await this.courseService.getCourseList(tenantId, filters);
            return this.ok(res, "Courses retrieved successfully", courses);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

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
    };

    public create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const scope = await this.getScope(req);
            if (scope.accessLevel !== AccessLevel.FULL) {
                return this.forbidden(res, "Only administrators can create courses");
            }

            const tenantId = this.getTenantId(req);
            const course = await this.courseService.addCourse(tenantId, req.body);
            return this.ok(res, "Course created successfully", course);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const scope = await this.getScope(req);
            if (scope.accessLevel !== AccessLevel.FULL) {
                return this.forbidden(res, "Only administrators can update course details");
            }

            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const course = await this.courseService.updateCourse(tenantId, id, req.body);
            return this.ok(res, "Course updated successfully", course);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const scope = await this.getScope(req);
            if (scope.accessLevel !== AccessLevel.FULL) {
                return this.forbidden(res, "Only administrators can delete courses");
            }

            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            await this.courseService.removeCourse(tenantId, id);
            return this.ok(res, "Course deleted successfully");
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };
}
