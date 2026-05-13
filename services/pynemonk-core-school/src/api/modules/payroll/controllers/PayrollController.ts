import { Request, Response } from "express";
import { injectable } from "tsyringe";
import PayrollService from "../services/PayrollService.js";
import BaseController from "../../../core/controllers/BaseController.js";

@injectable()
export default class PayrollController extends BaseController {
    constructor(private payrollService: PayrollService) {
        super();
    }

    public async saveStructure(req: Request, res: Response) {
        try {
            const { tenantId } = (req as any).user;
            const { staffId } = req.params;
            const data = await this.payrollService.saveSalaryStructure(tenantId, parseInt(staffId), req.body);
            return this.ok(res, "Salary structure saved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async generatePayslip(req: Request, res: Response) {
        try {
            const { tenantId } = (req as any).user;
            const { staffId, month, year } = req.body;
            const data = await this.payrollService.generateMonthlyPayslip(tenantId, staffId, month, year);
            return this.ok(res, "Payslip generated", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async pay(req: Request, res: Response) {
        try {
            const { tenantId, userId } = (req as any).user;
            const { id } = req.params;
            const data = await this.payrollService.processPayment(tenantId, parseInt(id), userId);
            return this.ok(res, "Payment processed and synced to accounting", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async getStaffPayroll(req: Request, res: Response) {
        try {
            const { tenantId } = (req as any).user;
            const { staffId } = req.params;
            const data = await this.payrollService.getStaffSalaryDetails(tenantId, parseInt(staffId));
            return this.ok(res, "Payroll details retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
