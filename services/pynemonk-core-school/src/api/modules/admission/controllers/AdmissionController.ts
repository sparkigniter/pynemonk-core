import { Request, Response } from "express";
import { injectable } from "tsyringe";
import ResourceController from "../../../core/controllers/ResourceController.js";
import AdmissionService from "../services/AdmissionService.js";

@injectable()
export default class AdmissionController extends ResourceController {
    constructor(private admissionService: AdmissionService) {
        super();
    }

    /**
     * POST /api/v1/school/admissions
     * Handles the full admission process for a new student.
     */
    public admit = async (req: Request, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;

            // Note: In a production app, we'd use a validator here (e.g. Zod/Joi)
            const result = await this.admissionService.admitStudent(tenantId, req.body);

            return this.ok(res, result, "Student admitted successfully");
        } catch (error: any) {
            console.error("Admission Error:", error);
            return this.badrequest(res, error.message || "Failed to process admission");
        }
    }
}
