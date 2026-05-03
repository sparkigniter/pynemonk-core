import { Response } from "express";
import { injectable, inject } from "tsyringe";
import { GradeService } from "../services/GradeService.js";
import { GradeValidator } from "../helpers/GradeHelper.js";
import { AuthenticatedRequest } from "../../../core/middleware/AuthMiddleware.js";
import ResourceController from "../../../core/controllers/ResourceController.js";
import { AccessLevel } from "../../../core/helpers/DataScopeHelper.js";

@injectable()
export class GradeController extends ResourceController {
    constructor(@inject(GradeService) private gradeService: GradeService) {
        super();
    }

    async create(req: AuthenticatedRequest, res: Response) {
        console.log("[GradeController] Creating grade", req.body);
        const { error, value } = GradeValidator.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        try {
            const tenantId = req.user.tenantId;
            if (!tenantId) throw new Error("Tenant ID missing from context");

            const grade = await this.gradeService.createGrade(tenantId, value);
            res.status(201).json(grade);
        } catch (err: any) {
            console.error("[GradeController] Error:", err);
            return this.internalservererror(res, err.message);
        }
    }

    async list(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = req.user.tenantId;
            const scope = await this.getScope(req);
            const { page, limit, search, ignoreScope } = req.query;
            
            const filters: any = {
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 100,
                search: search as string,
            };

            const canIgnoreScope = ignoreScope === 'true' && (
                req.user.permissions?.includes('student:read') || 
                req.user.permissions?.includes('student.directory:read')
            );

            if (scope.accessLevel !== AccessLevel.FULL && !canIgnoreScope) {
                filters.gradeIds = scope.gradeIds;
            }

            const result = await this.gradeService.getGrades(tenantId, filters);
            return this.ok(res, "Grades retrieved", result);
        } catch (err: any) {
            console.error("[GradeController] List Error:", err);
            return this.internalservererror(res, err.message);
        }
    }

    async update(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;
        try {
            const tenantId = req.user.tenantId;
            const scope = await this.getScope(req);

            if (!scope.hasGrade(parseInt(id))) {
                return this.forbidden(res, "You do not have access to this grade");
            }

            const grade = await this.gradeService.updateGrade(tenantId, parseInt(id), req.body);
            return this.ok(res, "Grade updated successfully", grade);
        } catch (err: any) {
            console.error("[GradeController] Update Error:", err);
            return this.internalservererror(res, err.message);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;
        try {
            const tenantId = req.user.tenantId;
            const scope = await this.getScope(req);

            if (!scope.hasGrade(parseInt(id))) {
                return this.forbidden(res, "You do not have access to this grade");
            }

            await this.gradeService.deleteGrade(tenantId, parseInt(id));
            return this.ok(res, "Grade deleted successfully");
        } catch (err: any) {
            console.error("[GradeController] Delete Error:", err);
            return this.internalservererror(res, err.message);
        }
    }
}
