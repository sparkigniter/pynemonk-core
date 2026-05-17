import { Response } from "express";
import { injectable } from "tsyringe";
import ResourceController from "../../../core/controllers/ResourceController.js";
import CertificateTemplateService from "../services/CertificateTemplateService.js";
import { AuthenticatedRequest } from "../../../core/middleware/AuthMiddleware.js";

@injectable()
export default class CertificateTemplateController extends ResourceController {
    constructor(private templateService: CertificateTemplateService) {
        super();
    }

    async getTemplate(req: AuthenticatedRequest, res: Response) {
        try {
            const { type } = req.params;
            const template = await this.templateService.getTemplate(req.user.tenantId, type);
            return this.ok(res, "Template retrieved", template);
        } catch (error: any) {
            return this.badrequest(res, error.message);
        }
    }

    async saveTemplate(req: AuthenticatedRequest, res: Response) {
        try {
            const template = await this.templateService.upsertTemplate(req.user.tenantId, req.body);
            return this.ok(res, "Template saved successfully", template);
        } catch (error: any) {
            return this.badrequest(res, error.message);
        }
    }
}
