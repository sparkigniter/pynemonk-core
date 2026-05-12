import { Response } from "express";
import { injectable } from "tsyringe";
import BaseController from "../../../core/controllers/BaseController.js";
import { AuthenticatedRequest } from "../../../core/middleware/requireAuth.js";
import PayrollHelper from "../helpers/PayrollHelper.js";

@injectable()
export default class PayrollController extends BaseController {
    constructor(private payrollHelper: PayrollHelper) {
        super();
    }

    public listSalaries = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const salaries = await this.payrollHelper.getSalaries(tenantId, req.query);
            return this.ok(res, "Salaries retrieved", salaries);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public generate = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const salary = await this.payrollHelper.generateMonthlySalary(tenantId, req.body);
            return this.ok(res, "Salary generated successfully", salary);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public pay = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const userId = req.user!.id;
            const salaryId = parseInt(req.params.id);
            await this.payrollHelper.markAsPaid(tenantId, userId, salaryId);
            return this.ok(res, "Salary paid and recorded in accounting");
        } catch (error: any) {
            return this.badrequest(res, error.message);
        }
    };
}
