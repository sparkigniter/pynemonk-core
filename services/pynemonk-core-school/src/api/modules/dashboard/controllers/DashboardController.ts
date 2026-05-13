import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { DashboardService } from "../services/DashboardService.js";
import BaseController from "../../../core/controllers/BaseController.js";

@injectable()
class DashboardController extends BaseController {
    constructor(private dashboardService: DashboardService) {
        super();
    }

    public async getDashboard(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const tenantId = user.tenantId;
            const role = user.roles[0] || '';
            const userId = user.userId;

            const data = await this.dashboardService.getDashboardData(tenantId, role, userId, { days: req.query.days as string });
            return this.ok(res, "Dashboard data retrieved", data);
        } catch (error: any) {
            console.error("[DashboardController] Error:", error);
            return this.internalservererror(res, error.message);
        }
    }
}

export default DashboardController;
