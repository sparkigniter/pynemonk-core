import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import FeePaymentService from "../services/FeePaymentService.js";
import BaseController from "../../../core/controllers/BaseController.js";

@injectable()
export default class FeePaymentController extends BaseController {
    constructor(@inject(FeePaymentService) private feePaymentService: FeePaymentService) {
        super();
    }

    public async list(req: any, res: Response) {
        try {
            const tenantId = req.user.tenantId;
            const payments = await this.feePaymentService.getPayments(tenantId);
            return this.ok(res, "Payments retrieved", payments);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async get(req: any, res: Response) {
        try {
            const tenantId = req.user.tenantId;
            const id = parseInt(req.params.id);
            const payment = await this.feePaymentService.getPaymentById(tenantId, id);
            if (!payment) return this.notfound(res, "Payment not found");
            return this.ok(res, "Payment details retrieved", payment);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async create(req: any, res: Response) {
        try {
            const tenantId = req.user.tenantId;
            const userId = req.user.userId;
            const payment = await this.feePaymentService.recordPayment(tenantId, userId, req.body);
            return this.ok(res, "Payment recorded successfully", payment);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async delete(req: any, res: Response) {
        try {
            const tenantId = req.user.tenantId;
            const userId = req.user.userId;
            const id = parseInt(req.params.id);
            const { reason } = req.body;
            
            await this.feePaymentService.reversePayment(tenantId, userId, id, reason || "Manual reversal");
            return this.ok(res, "Payment reversed successfully");
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
