import { Response } from "express";
import { injectable, inject } from "tsyringe";
import ReportHelper from "../helpers/ReportHelper.js";
import BaseController from "../../../core/controllers/BaseController.js";
import { AuthenticatedRequest } from "../../../core/middleware/requireAuth.js";

@injectable()
export default class ReportController extends BaseController {
    constructor(@inject(ReportHelper) private reportHelper: ReportHelper) {
        super();
    }

    public getTrialBalance = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const data = await this.reportHelper.getTrialBalance(tenantId);
            return this.ok(res, "Trial Balance retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getProfitAndLoss = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().getFullYear(), 0, 1);
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
            
            const data = await this.reportHelper.getProfitAndLoss(tenantId, startDate, endDate);
            return this.ok(res, "Profit and Loss statement retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getSummary = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const summary = await this.reportHelper.getSummary(tenantId);
            return this.ok(res, "Summary retrieved", summary);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getAgingReport = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const report = await this.reportHelper.getAPAgingReport(tenantId);
            return this.ok(res, "Aging report retrieved", report);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getLedger = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const { account_id, start_date, end_date } = req.query;
            const ledger = await this.reportHelper.getAccountLedger(
                tenantId, 
                Number(account_id), 
                new Date(start_date as string), 
                new Date(end_date as string)
            );
            return this.ok(res, "Ledger retrieved", ledger);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };
}
