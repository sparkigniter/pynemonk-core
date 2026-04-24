import { injectable, inject } from "tsyringe";
import { WorkflowHelper } from "../helpers/WorkflowHelper.js";

@injectable()
export class WorkflowService {
    constructor(@inject(WorkflowHelper) private workflowHelper: WorkflowHelper) {}

    async createTemplate(tenantId: number, data: any) {
        return this.workflowHelper.createTemplate(tenantId, data);
    }

    async getTemplates(tenantId: number) {
        return this.workflowHelper.getTemplates(tenantId);
    }

    async startOnboarding(tenantId: number, data: any) {
        return this.workflowHelper.startInstance(tenantId, data);
    }

    async getPipeline(tenantId: number) {
        // Simple pipeline: list all active instances with their current step
        return this.workflowHelper.getTemplates(tenantId); // Placeholder
    }

    async getInstance(tenantId: number, id: number) {
        return this.workflowHelper.getInstanceDetails(tenantId, id);
    }
}
