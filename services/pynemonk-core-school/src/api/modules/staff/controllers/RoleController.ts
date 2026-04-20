import { Request, Response } from "express";
import { injectable } from "tsyringe";
import RoleService from "../services/RoleService.js";
import ResourceController from "../../../core/controllers/ResourceController.js";
import { AuthenticatedRequest } from "../../../core/middleware/AuthMiddleware.js";

@injectable()
export default class RoleController extends ResourceController {
    constructor(private roleService: RoleService) {
        super();
    }

    /**
     * GET /api/v1/school/roles
     * List all available roles for the tenant.
     */
    public listAvailableRoles = async (req: Request, res: Response) => {
        try {
            const tenantId = this.getTenantId(req);
            const roles = await this.roleService.getAvailableRoles(tenantId);
            return this.ok(res, "Available roles retrieved successfully", roles);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    /**
     * POST /api/v1/school/roles/assign
     * Assign a role to the current user (self-assignment) or another user.
     */
    public assignRole = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = this.getTenantId(req);
            const userId = req.body.userId || req.user!.userId; // Default to self
            const { roleSlug } = req.body;

            if (!roleSlug) {
                return this.badrequest(res, "roleSlug is required");
            }

            await this.roleService.assignRole(tenantId, userId, roleSlug);

            return this.ok(res, `Role '${roleSlug}' assigned successfully`);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    /**
     * DELETE /api/v1/school/roles/remove
     * Remove a role from a user.
     */
    public removeRole = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = this.getTenantId(req);
            const userId = req.body.userId || req.user!.userId;
            const { roleSlug } = req.body;

            await this.roleService.removeRole(tenantId, userId, roleSlug);
            return this.ok(res, `Role '${roleSlug}' removed successfully`);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };

    /**
     * GET /api/v1/school/roles/my-roles
     * Get all roles assigned to the current user.
     */
    public getMyRoles = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = this.getTenantId(req);
            const userId = req.user!.userId;
            const roles = await this.roleService.getUserRoles(tenantId, userId);
            return this.ok(res, "User roles retrieved successfully", roles);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    };
}
