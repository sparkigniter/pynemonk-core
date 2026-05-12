import { injectable, inject } from "tsyringe";
import e from "express";
import FeeCategoryService from "../services/FeeCategoryService.js";
import ApiResponseHandler from "../../../core/ApiResponseHandler.js";

@injectable()
export default class FeeCategoryController {
    constructor(@inject(FeeCategoryService) private feeCategoryService: FeeCategoryService) {}

    public async create(req: e.Request, res: e.Response): Promise<void> {
        try {
            const user = (req as any).user;
            const tenantId = user.tenant_id;
            
            const category = await this.feeCategoryService.create(tenantId, req.body);
            ApiResponseHandler.ok(res, "Fee category created successfully", category);
        } catch (error: any) {
            console.error(error);
            ApiResponseHandler.badrequest(res, error.message || "Failed to create fee category");
        }
    }

    public async list(req: e.Request, res: e.Response): Promise<void> {
        try {
            const user = (req as any).user;
            const tenantId = user.tenant_id || user.tenantId;
            
            const categories = await this.feeCategoryService.list(tenantId);
            ApiResponseHandler.ok(res, "Success", categories);
        } catch (error: any) {
            console.error(error);
            ApiResponseHandler.badrequest(res, "Failed to list fee categories");
        }
    }

    public async listInstallments(req: e.Request, res: e.Response): Promise<void> {
        try {
            const user = (req as any).user;
            const tenantId = user.tenant_id || user.tenantId;
            
            const installments = await this.feeCategoryService.listInstallments(tenantId);
            ApiResponseHandler.ok(res, "Success", installments);
        } catch (error: any) {
            console.error(error);
            ApiResponseHandler.badrequest(res, "Failed to list installments");
        }
    }
}
