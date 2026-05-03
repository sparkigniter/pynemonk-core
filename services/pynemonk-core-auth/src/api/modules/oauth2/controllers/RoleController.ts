import e from "express";
import BaseController from "../../../core/controllers/BaseController.js";
import { RESPONSE_TYPES } from '../../../../constants/constants.js';
import { injectable, inject } from "tsyringe";

@injectable()
class RoleController extends BaseController {

    constructor(@inject("DB") private db: any) {
        super();
    }

    /**
     * Get all roles for the current tenant
     */
    public async getAll(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const user = (req as any).user;
            const tenantId = user?.tenant_id;
            const isSystemAdmin = user?.roles?.includes('system_admin');

            let query = `
                SELECT id, name, slug, description, is_system, tenant_id, created_at 
                FROM auth.role 
                WHERE is_deleted = FALSE
            `;
            const params: any[] = [];
            const { clientId } = req.query;

            if (clientId) {
                const clientRes = await this.db.query(
                    "SELECT id, tenant_id FROM auth.client WHERE client_id = $1", [clientId]
                );
                if (clientRes.rows.length === 0) return this.badrequest(res, "Client not found");

                const clientTenantId = clientRes.rows[0].tenant_id;
                if (clientTenantId === null) {
                    // Global client (no tenant) → show global roles only
                    query += ` AND tenant_id IS NULL`;
                } else {
                    // Tenant client → show roles for that tenant ONLY (these have the correct role IDs)
                    query += ` AND tenant_id = $1`;
                    params.push(clientTenantId);
                }
            } else if (isSystemAdmin) {
                // System Admin without client: Return global roles only
                // This prevents duplicates from showing in the admin app (which would otherwise list every tenant's copy of the roles)
                query += ` AND tenant_id IS NULL`;
            } else {
                if (!tenantId) return this.unautharized(res, "Tenant context missing");
                query += ` AND tenant_id = $1`;
                params.push(tenantId);
            }

            query += ` ORDER BY name ASC`;
            console.log("Executing Query:", query, params);
            const result = await this.db.query(query, params);
            console.log("Query returned rows count:", result.rows.length);
            
            return this.ok(res, RESPONSE_TYPES.SUCCESS, result.rows);
        } catch (error) {
            console.error("[RoleController.getAll]", error);
            return this.internalservererror(res, "An error occurred while fetching roles");
        }
    }
}

export default RoleController;
