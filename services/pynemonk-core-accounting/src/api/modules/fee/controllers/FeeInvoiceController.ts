import { Response } from "express";
import { injectable } from "tsyringe";
import BaseController from "../../../core/controllers/BaseController.js";
import { AuthenticatedRequest } from "../../../core/middleware/requireAuth.js";
import FeeInvoiceService from "../services/FeeInvoiceService.js";

@injectable()
export default class FeeInvoiceController extends BaseController {
    public list = async (req: any, res: Response) => {
        try {
            const tenantId = req.user.tenantId;
            const invoices = await this.feeInvoiceService.getInvoices(tenantId);
            return this.ok(res, "Invoices retrieved successfully", invoices);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public get = async (req: any, res: Response) => {
        try {
            const tenantId = req.user.tenantId;
            const id = parseInt(req.params.id);
            const invoice = await this.feeInvoiceService.getInvoiceById(tenantId, id);
            if (!invoice) return this.notfound(res, "Invoice not found");
            return this.ok(res, "Invoice retrieved successfully", invoice);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public void = async (req: any, res: Response) => {
        try {
            const tenantId = req.user.tenantId;
            const userId = req.user.userId;
            const id = parseInt(req.params.id);
            const { reason } = req.body;

            const result = await this.feeInvoiceService.voidInvoice(tenantId, userId, id, reason || "Manual void");
            return this.ok(res, "Invoice voided successfully", result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    constructor(private feeInvoiceService: FeeInvoiceService) {
        super();
    }

    public batchGenerate = async (req: any, res: Response) => {
        try {
            const tenantId = req.user.tenantId;
            const { installment_id } = req.body;
            if (!installment_id) return this.badrequest(res, "installment_id is required");

            const result = await this.feeInvoiceService.batchGenerateInvoices(tenantId, parseInt(installment_id));
            return this.ok(res, "Invoices generated successfully", result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };
}
