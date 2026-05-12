import { Response } from "express";
import { injectable } from "tsyringe";
import BaseController from "../../../core/controllers/BaseController.js";
import { AuthenticatedRequest } from "../../../core/middleware/requireAuth.js";
import VendorHelper from "../helpers/VendorHelper.js";

@injectable()
export default class VendorController extends BaseController {
    constructor(private vendorHelper: VendorHelper) {
        super();
    }

    public listVendors = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const search = req.query.search as string;
            const vendors = await this.vendorHelper.list(tenantId, search);
            return this.ok(res, "Vendors retrieved", vendors);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public createVendor = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const vendor = await this.vendorHelper.create(tenantId, req.body);
            return this.ok(res, "Vendor created successfully", vendor);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public listBills = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const bills = await this.vendorHelper.getBills(tenantId);
            return this.ok(res, "Bills retrieved", bills);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public createBill = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const bill = await this.vendorHelper.createBill(tenantId, req.body);
            return this.ok(res, "Bill created successfully", bill);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public recordPayment = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const payment = await this.vendorHelper.recordPayment(tenantId, req.body);
            return this.ok(res, "Payment recorded successfully", payment);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public listPayments = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const payments = await this.vendorHelper.getPayments(tenantId);
            return this.ok(res, "Payments retrieved", payments);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };
}
