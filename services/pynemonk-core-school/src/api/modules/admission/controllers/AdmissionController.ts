import { Response } from "express";
import { injectable } from "tsyringe";
import ResourceController from "../../../core/controllers/ResourceController.js";
import AdmissionService from "../services/AdmissionService.js";
import AdmissionWorkflowService from "../services/AdmissionWorkflowService.js";
import { AuthenticatedRequest } from "../../../core/middleware/AuthMiddleware.js";
import { AdmissionValidator } from "../validator/AdmissionValidator.js";

@injectable()
export default class AdmissionController extends ResourceController {
    constructor(
        private admissionService: AdmissionService,
        private workflowService: AdmissionWorkflowService
    ) {
        super();
    }

    /**
     * POST /api/v1/school/admissions
     * Handles the legacy/direct admission process.
     */
    public admit = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const { error, value } = AdmissionValidator.validate(req.body);
            if (error) return this.badrequest(res, error.details[0].message);

            const result = await this.admissionService.admitStudent(tenantId, value, req.user!.userId);
            return this.ok(res, "Student admitted successfully", result);
        } catch (error: any) {
            return this.badrequest(res, error.message);
        }
    };

    /**
     * POST /api/v1/school/admissions/workflow/start
     */
    public startWorkflow = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const result = await this.workflowService.createApplication(req.user!.tenantId, req.body, req.user!.userId);
            return this.ok(res, "Admission workflow started", result);
        } catch (error: any) {
            return this.badrequest(res, error.message);
        }
    };

    /**
     * PATCH /api/v1/school/admissions/workflow/:id
     */
    public updateWorkflow = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { stage, data, next_stage } = req.body;
            const result = await this.workflowService.updateApplication(req.user!.tenantId, parseInt(req.params.id), stage, data, next_stage);
            return this.ok(res, "Application progress saved", result);
        } catch (error: any) {
            return this.badrequest(res, error.message);
        }
    };

    /**
     * POST /api/v1/school/admissions/workflow/:id/finalize
     */
    public finalizeWorkflow = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const result = await this.workflowService.finalizeAdmission(req.user!.tenantId, parseInt(req.params.id), req.user!.userId);
            return this.ok(res, "Admission finalized and student profile created", result);
        } catch (error: any) {
            return this.badrequest(res, error.message);
        }
    };

    /**
     * GET /api/v1/school/admissions/applications
     */
    public listApplications = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const result = await this.workflowService.listApplications(req.user!.tenantId);
            return this.ok(res, "Applications retrieved successfully", result);
        } catch (error: any) {
            return this.badrequest(res, error.message);
        }
    };

    /**
     * GET /api/v1/school/admissions/applications/:id
     */
    public getApplication = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const result = await this.workflowService.getApplication(req.user!.tenantId, parseInt(req.params.id));
            return this.ok(res, "Application retrieved successfully", result);
        } catch (error: any) {
            return this.badrequest(res, error.message);
        }
    };
}
