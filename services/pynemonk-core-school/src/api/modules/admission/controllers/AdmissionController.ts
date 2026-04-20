import { Request, Response } from "express";
import { injectable } from "tsyringe";
import ResourceController from "../../../core/controllers/ResourceController.js";
import AdmissionService from "../services/AdmissionService.js";
import { AuthenticatedRequest } from "../../../core/middleware/AuthMiddleware.js";
import { AdmissionValidator } from "../validator/AdmissionValidator.js";

@injectable()
export default class AdmissionController extends ResourceController {
    constructor(private admissionService: AdmissionService) {
        super();
    }

    /**
     * POST /api/v1/school/admissions
     * Handles the full admission process for a new student.
     */
    public admit = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;

            // Validate input
            const { error, value } = AdmissionValidator.validate(req.body);
            if (error) {
                return this.badrequest(res, error.details[0].message);
            }

            const result = await this.admissionService.admitStudent(tenantId, value);

            return this.ok(res, result, "Student admitted successfully");
        } catch (error: any) {
            console.error("Admission Error:", error);
            return this.badrequest(res, error.message || "Failed to process admission");
        }
    }
}
