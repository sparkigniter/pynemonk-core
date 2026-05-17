import { Response } from "express";
import { injectable } from "tsyringe";
import BaseController from "../../../core/controllers/BaseController.js";
import { AuthenticatedRequest } from "../../../core/middleware/requireAuth.js";
import SystemMappingHelper from "../helpers/SystemMappingHelper.js";

import LateFeeService from "../helpers/LateFeeService.js";

@injectable()
export default class AutomationController extends BaseController {
    constructor(
        private mappingHelper: SystemMappingHelper,
        private lateFeeService: LateFeeService
    ) {
        super();
    }

    public runLateFeeAutomation = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const userId = req.user!.id;
            const result = await this.lateFeeService.processLateFees(tenantId, userId);
            return this.ok(res, "Late fee automation completed", result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getLateFeePolicies = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const policies = await this.lateFeeService.getPolicies(tenantId);
            return this.ok(res, "Policies retrieved", policies);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public createLateFeePolicy = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const policy = await this.lateFeeService.createPolicy(tenantId, req.body);
            return this.ok(res, "Policy created", policy);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    /**
     * Trigger an automated transaction from an external event (Admission, Payroll, etc.)
     */
    public trigger = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const userId = req.user!.id;
            const { type, amount, reference, description } = req.body;

            if (!type || !amount) {
                return this.badrequest(res, "Missing required parameters (type, amount)");
            }

            const entry = await this.mappingHelper.postAutomatedTransaction(tenantId, userId, {
                type,
                amount: parseFloat(amount),
                reference,
                description
            });

            return this.ok(res, "Automated transaction posted", entry);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public getMappings = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const mappings = await this.mappingHelper.getMappings(tenantId);
            return this.ok(res, "Mappings retrieved", mappings);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    public saveMapping = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const { mapping_key, account_id } = req.body;
            await this.mappingHelper.setMapping(tenantId, mapping_key, account_id);
            return this.ok(res, "Mapping saved successfully");
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };
}
