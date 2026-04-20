import { Response } from "express";
import { injectable, inject } from "tsyringe";
import { GradeService } from "../services/GradeService.js";
import { GradeValidator } from "../helpers/GradeHelper.js";
import { AuthenticatedRequest } from "../../../core/middleware/AuthMiddleware.js";

@injectable()
export class GradeController {
    constructor(@inject(GradeService) private gradeService: GradeService) {}

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
            res.status(500).json({ error: err.message });
        }
    }

    async list(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = req.user.tenantId;
            const grades = await this.gradeService.getGrades(tenantId);
            res.json(grades);
        } catch (err: any) {
            console.error("[GradeController] List Error:", err);
            res.status(500).json({ error: err.message });
        }
    }

    async update(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;
        try {
            const tenantId = req.user.tenantId;
            const grade = await this.gradeService.updateGrade(tenantId, parseInt(id), req.body);
            res.json(grade);
        } catch (err: any) {
            console.error("[GradeController] Update Error:", err);
            res.status(500).json({ error: err.message });
        }
    }

    async delete(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;
        try {
            const tenantId = req.user.tenantId;
            await this.gradeService.deleteGrade(tenantId, parseInt(id));
            res.status(204).send();
        } catch (err: any) {
            console.error("[GradeController] Delete Error:", err);
            res.status(500).json({ error: err.message });
        }
    }
}
