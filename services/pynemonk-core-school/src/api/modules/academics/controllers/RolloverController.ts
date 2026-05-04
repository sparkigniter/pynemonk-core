import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import RolloverService from "../services/RolloverService.js";
import AcademicYearHelper from "../helpers/AcademicYearHelper.js";
import BaseController from "../../../core/controllers/BaseController.js";

@injectable()
export default class RolloverController extends BaseController {
    constructor(
        @inject(RolloverService) private rolloverService: RolloverService,
        @inject("DB") private db: Pool,
        @inject(AcademicYearHelper) private academicYearHelper: AcademicYearHelper
    ) {
        super();
    }

    public async createYear(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const year = await this.academicYearHelper.create(tenantId, req.body);
            return this.ok(res, "Academic year created", year);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async getYears(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const result = await this.db.query("SELECT * FROM school.academic_year WHERE tenant_id = $1 AND is_deleted = FALSE ORDER BY start_date DESC", [tenantId]);
            return this.ok(res, "Academic years retrieved", result.rows);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async preview(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const sourceYearId = parseInt(req.query.source_year_id as string);
            const preview = await this.rolloverService.getRolloverPreview(tenantId, sourceYearId);
            return this.ok(res, "Rollover preview retrieved", preview);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async execute(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const result = await this.rolloverService.executeRollover(tenantId, req.body);
            return this.ok(res, "Rollover executed successfully", result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
