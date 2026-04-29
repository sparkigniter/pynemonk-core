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
        return this.workflowHelper.getInstances(tenantId);
    }

    async getInstance(tenantId: number, id: number) {
        return this.workflowHelper.getInstanceDetails(tenantId, id);
    }

    async getStudentActiveWorkflow(tenantId: number, studentId: number) {
        return this.workflowHelper.findActiveInstanceByTarget(tenantId, studentId);
    }

    async completeStepByType(tenantId: number, instanceId: number, taskType: string, data: any) {
        return this.workflowHelper.completeStepByType(tenantId, instanceId, taskType, data);
    }
}
