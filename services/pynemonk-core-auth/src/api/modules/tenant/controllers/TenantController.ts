import "reflect-metadata";
import e from "express";
import { injectable, inject } from "tsyringe";
import BaseController from "../../../core/controllers/BaseController.js";
import TenantService from "../services/TenantService.js";
import ValidationError from "../../../errors/ValidationError.js";
import { RESPONSE_TYPES } from "../../../../constants/constants.js";

@injectable()
class TenantController extends BaseController {

    constructor(@inject(TenantService) private tenantService: TenantService) {
        super();
    }

    /**
     * GET /api/v1/tenant/packages
     * Returns all available subscription packages.
     */
    public async listPackages(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const packages = await this.tenantService.getPackages();
            return this.ok(res, RESPONSE_TYPES.SUCCESS, packages);
        } catch (error) {
            return this.internalservererror(res, "Failed to fetch packages");
        }
    }

    /**
     * POST /api/v1/tenant/register
     * Register a new school.
     * Body: { name, email, phone?, address?, city?, state?, country?, package_id }
     */
    public async register(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const tenant = await this.tenantService.registerTenant(req.body);
            return this.ok(res, RESPONSE_TYPES.SUCCESS, tenant);
        } catch (error) {
            if (error instanceof ValidationError) {
                return this.badrequest(res, error.message);
            }
            return this.internalservererror(
                res,
                error instanceof Error ? error.message : "Registration failed"
            );
        }
    }

    /**
     * GET /api/v1/tenant/:id
     * Get tenant details.
     */
    public async getTenant(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) return this.badrequest(res, "Invalid tenant id");
            const tenant = await this.tenantService.getTenantById(id);
            return this.ok(res, RESPONSE_TYPES.SUCCESS, tenant);
        } catch (error) {
            if (error instanceof ValidationError) {
                return this.badrequest(res, error.message);
            }
            return this.internalservererror(res, "Failed to fetch tenant");
        }
    }

    /**
     * POST /api/v1/tenant/:id/setup-owner
     * Step 2 of registration — create the owner account for an existing tenant.
     * One-time only: fails if an owner already exists.
     * Body: { admin_email, admin_password }
     */
    public async setupOwner(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const tenantId = parseInt(req.params.id, 10);
            if (isNaN(tenantId)) return this.badrequest(res, "Invalid tenant id");
            const owner = await this.tenantService.setupOwner(tenantId, req.body);
            return this.ok(res, "Owner account created successfully", owner);
        } catch (error) {
            if (error instanceof ValidationError) {
                return this.badrequest(res, error.message);
            }
            return this.internalservererror(
                res,
                error instanceof Error ? error.message : "Owner setup failed"
            );
        }
    }
}

export default TenantController;
