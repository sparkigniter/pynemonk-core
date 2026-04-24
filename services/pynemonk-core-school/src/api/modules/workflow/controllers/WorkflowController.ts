import { injectable, inject } from "tsyringe";
import e from "express";
import { WorkflowService } from "../services/WorkflowService.js";

@injectable()
export class WorkflowController {
    constructor(@inject(WorkflowService) private workflowService: WorkflowService) {}

    async createTemplate(req: e.Request, res: e.Response) {
        const tenantId = (req as any).user.tenantId;
        const result = await this.workflowService.createTemplate(tenantId, req.body);
        res.json({ success: true, data: result });
    }

    async listTemplates(req: e.Request, res: e.Response) {
        const tenantId = (req as any).user.tenantId;
        const result = await this.workflowService.getTemplates(tenantId);
        res.json({ success: true, data: result });
    }

    async startProcess(req: e.Request, res: e.Response) {
        const tenantId = (req as any).user.tenantId;
        const result = await this.workflowService.startOnboarding(tenantId, req.body);
        res.json({ success: true, data: result });
    }

    async getInstance(req: e.Request, res: e.Response) {
        const tenantId = (req as any).user.tenantId;
        const result = await this.workflowService.getInstance(tenantId, parseInt(req.params.id));
        res.json({ success: true, data: result });
    }
}
