import { Response } from "express";
import { injectable } from "tsyringe";
import BaseController from "../../../core/controllers/BaseController.js";
import { AuthenticatedRequest } from "../../../core/middleware/requireAuth.js";
import InvoiceHelper from "../helpers/InvoiceHelper.js";
import PartnerHelper from "../helpers/PartnerHelper.js";

@injectable()
export default class ReceivableController extends BaseController {
    constructor(
        private invoiceHelper: InvoiceHelper,
        private partnerHelper: PartnerHelper
    ) {
        super();
    }

    public listInvoices = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const search = req.query.search as string;
            const status = req.query.status as string;
            const invoices = await this.invoiceHelper.list(tenantId, { search, status });
            return this.ok(res, "Receivables retrieved", invoices);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public createInvoice = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const userId = req.user!.id;
            const invoice = await this.invoiceHelper.createGenericInvoiceWithJournal(tenantId, userId, req.body);
            return this.ok(res, "Invoice created successfully", invoice);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };


    public getSummary = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const summary = await this.invoiceHelper.getSummary(tenantId);
            return this.ok(res, "AR Summary retrieved", summary);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public listPartners = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const search = req.query.search as string;
            const type = req.query.type as string || 'customer';
            const partners = await this.partnerHelper.list(tenantId, type, search);
            return this.ok(res, "Partners retrieved", partners);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public createPartner = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const partner = await this.partnerHelper.create(tenantId, req.body);
            return this.ok(res, "Partner created successfully", partner);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };
}
