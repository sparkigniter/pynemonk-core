import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import FeePaymentService from "../services/FeePaymentService.js";
import BaseController from "../../../core/controllers/BaseController.js";

@injectable()
export default class FeePaymentController extends BaseController {
    constructor(@inject(FeePaymentService) private feePaymentService: FeePaymentService) {
        super();
    }

    public async list(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const payments = await this.feePaymentService.getPayments(tenantId);
            return this.ok(res, "Payments retrieved", payments);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async get(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const id = parseInt(req.params.id);
            const payment = await this.feePaymentService.getPaymentById(tenantId, id);
            if (!payment) return this.notfound(res, "Payment not found");
            return this.ok(res, "Payment details retrieved", payment);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async create(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const userId = (req as any).user.id;
            const payment = await this.feePaymentService.recordPayment(tenantId, { ...req.body, received_by: userId });
            return this.ok(res, "Payment recorded successfully", payment);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const id = parseInt(req.params.id);
            await this.feePaymentService.cancelPayment(tenantId, id);
            return this.ok(res, "Payment cancelled successfully");
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
