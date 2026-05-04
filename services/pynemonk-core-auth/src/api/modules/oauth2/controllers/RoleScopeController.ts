import e from "express";
import BaseController from "../../../core/controllers/BaseController.js";
import { RESPONSE_TYPES } from '../../../../constants/constants.js';
import { injectable, inject } from "tsyringe";

@injectable()
class RoleScopeController extends BaseController {

    constructor(@inject("DB") private db: any) {
        super();
    }

    /**
     * Fetch all scope mappings for a specific (Client, Role) pair.
     * This is the "Source of Truth" for the Admin UI.
     */
    public async getAll(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const { clientId, roleId } = req.query;

            if (!clientId) {
                // Return Global Template Scopes (Role-level standards)
                let templateQuery = `
                    SELECT rs.id, rs.role_id, rs.scope_id, rs.granted, s.value as scope_value
                    FROM auth.role_scope rs
                    JOIN auth.scope s ON rs.scope_id = s.id
                    WHERE rs.tenant_id IS NULL
                `;
                const templateParams: any[] = [];
                if (roleId) {
                    templateQuery += ` AND rs.role_id = $1`;
                    templateParams.push(roleId);
                }
                const result = await this.db.query(templateQuery, templateParams);
                return this.ok(res, RESPONSE_TYPES.SUCCESS, result.rows);
            }

            console.log(`[RoleScopeController.getAll] Fetching assignments for Client: ${clientId}, Role: ${roleId || 'ALL'}`);

            let query = `
                SELECT crs.id, crs.role_id, crs.scope_id, crs.granted, s.value as scope_value
                FROM auth.client_role_scope crs
                JOIN auth.scope s ON crs.scope_id = s.id
                JOIN auth.client c ON crs.client_id = c.id
                WHERE c.client_id = $1
            `;
            
            const params: any[] = [clientId];
            if (roleId) {
                query += ` AND crs.role_id = $2`;
                params.push(roleId);
            }
            
            const result = await this.db.query(query, params);
            return this.ok(res, RESPONSE_TYPES.SUCCESS, result.rows);
        } catch (error) {
            console.error("[RoleScopeController.getAll]", error);
            return this.internalservererror(res, "An error occurred while fetching assignments");
        }
    }

    /**
     * Grant or Update a scope assignment for a client-role context.
     */
    public async create(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const { role_id, scope_id, clientId } = req.body;

            if (!clientId) {
                // Manage the Global Template (auth.role_scope)
                const query = `
                    INSERT INTO auth.role_scope (role_id, scope_id, granted, tenant_id)
                    VALUES ($1, $2, TRUE, NULL)
                    ON CONFLICT (role_id, scope_id, (tenant_id IS NULL)) DO UPDATE SET granted = TRUE
                    RETURNING *
                `;
                const result = await this.db.query(query, [role_id, scope_id]);
                console.log(`[RoleScopeController.create] SUCCESS: Global Template updated for Role ${role_id}`);
                return this.ok(res, RESPONSE_TYPES.SUCCESS, result.rows[0]);
            }

            // 1. Resolve internal Client ID
            const clientRes = await this.db.query("SELECT id FROM auth.client WHERE client_id = $1", [clientId]);
            if (clientRes.rows.length === 0) return this.badrequest(res, "Target application not found");
            const internalClientId = clientRes.rows[0].id;

            // 2. Upsert assignment
            const query = `
                INSERT INTO auth.client_role_scope (client_id, role_id, scope_id, granted)
                VALUES ($1, $2, $3, TRUE)
                ON CONFLICT (client_id, role_id, scope_id) DO UPDATE SET granted = TRUE
                RETURNING *
            `;
            const result = await this.db.query(query, [internalClientId, role_id, scope_id]);
            
            console.log(`[RoleScopeController.create] SUCCESS: Scope ${scope_id} granted to Role ${role_id} for App ${clientId}`);
            return this.ok(res, RESPONSE_TYPES.SUCCESS, result.rows[0]);
        } catch (error) {
            console.error("[RoleScopeController.create]", error);
            return this.internalservererror(res, "An error occurred during assignment");
        }
    }

    /**
     * Revoke a scope assignment.
     */
    public async delete(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const { roleId, scopeId } = req.params;
            const { clientId } = req.query;

            if (!roleId || !scopeId) {
                return this.badrequest(res, "Missing roleId or scopeId");
            }

            if (!clientId) {
                // Revoke from Global Template
                await this.db.query(`
                    DELETE FROM auth.role_scope 
                    WHERE role_id = $1 AND scope_id = $2 AND tenant_id IS NULL
                `, [roleId, scopeId]);
                console.log(`[RoleScopeController.delete] SUCCESS: Global Template revoked for Role ${roleId}`);
                return this.ok(res, RESPONSE_TYPES.SUCCESS, { message: "Global template revoked" });
            }

            const query = `
                DELETE FROM auth.client_role_scope 
                WHERE client_id = (SELECT id FROM auth.client WHERE client_id = $1)
                  AND role_id = $2 AND scope_id = $3
            `;
            await this.db.query(query, [clientId, roleId, scopeId]);
            
            console.log(`[RoleScopeController.delete] SUCCESS: Scope ${scopeId} revoked from Role ${roleId} for App ${clientId}`);
            return this.ok(res, RESPONSE_TYPES.SUCCESS, { message: "Scope assignment revoked" });
        } catch (error) {
            console.error("[RoleScopeController.delete]", error);
            return this.internalservererror(res, "An error occurred during revocation");
        }
    }

    /**
     * Bulk Grant all possible scopes to a role for a specific client.
     */
    public async bulkGrant(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const { roleId, clientId } = req.body;
            if (!roleId || !clientId) return this.badrequest(res, "Missing bulk grant context");

            await this.db.query(`
                INSERT INTO auth.client_role_scope (client_id, role_id, scope_id, granted)
                SELECT (SELECT id FROM auth.client WHERE client_id = $1), $2, id, TRUE FROM auth.scope
                ON CONFLICT (client_id, role_id, scope_id) DO UPDATE SET granted = TRUE
            `, [clientId, roleId]);

            return this.ok(res, RESPONSE_TYPES.SUCCESS, { message: "All scopes granted successfully for this app context" });
        } catch (error) {
            console.error("[RoleScopeController.bulkGrant]", error);
            return this.internalservererror(res, "Bulk grant failed");
        }
    }

    /**
     * Bulk Revoke all scopes.
     */
    public async bulkRevoke(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const { roleId, clientId } = req.body;
            if (!roleId || !clientId) return this.badrequest(res, "Missing bulk revoke context");

            await this.db.query(`
                DELETE FROM auth.client_role_scope 
                WHERE client_id = (SELECT id FROM auth.client WHERE client_id = $1)
                  AND role_id = $2
            `, [clientId, roleId]);

            return this.ok(res, RESPONSE_TYPES.SUCCESS, { message: "All scopes revoked successfully for this app context" });
        } catch (error) {
            console.error("[RoleScopeController.bulkRevoke]", error);
            return this.internalservererror(res, "Bulk revoke failed");
        }
    }

    /**
     * Sync from the Role's own definition (data_scope).
     * This fulfills the 'Sync Template' request without using Global Templates.
     */
    public async syncTemplate(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const { roleId } = req.params;
            const { clientId } = req.body;

            if (!roleId || !clientId) return this.badrequest(res, "Missing roleId or clientId");

            // 1. Resolve internal Client ID
            const clientRes = await this.db.query("SELECT id FROM auth.client WHERE client_id = $1", [clientId]);
            if (clientRes.rows.length === 0) return this.badrequest(res, "Client not found");
            const internalClientId = clientRes.rows[0].id;

            // 2. Find the Template (Business Standard) for this role. 
            // We prefer a client-specific template if it exists, falling back to the global one.
            const templateRes = await this.db.query(`
                SELECT rt.data_scope, gt.id as global_role_id
                FROM auth.role cr
                JOIN auth.role_template rt ON cr.slug = rt.slug 
                    AND (rt.client_id IS NULL OR rt.client_id = $2)
                LEFT JOIN auth.role gt ON cr.slug = gt.slug AND gt.tenant_id IS NULL
                WHERE cr.id = $1
                ORDER BY rt.client_id DESC NULLS LAST
                LIMIT 1
            `, [roleId, internalClientId]);

            if (templateRes.rows.length === 0) {
                return this.badrequest(res, "No template definition found for this role");
            }
            const { global_role_id: globalRoleId, data_scope: dataScope } = templateRes.rows[0];

            // 3. Clear existing assignments for this app-role
            await this.db.query(`
                DELETE FROM auth.client_role_scope 
                WHERE client_id = $1 AND role_id = $2
            `, [internalClientId, roleId]);

            let scopesAdded = 0;

            // 4. Priority 1: Sync from data_scope (Business Standards)
            // We only sync scopes that are actually authorized for this client (auth.client_scope)
            if (dataScope && Array.isArray(dataScope) && dataScope.length > 0) {
                const insertRes = await this.db.query(`
                    INSERT INTO auth.client_role_scope (client_id, role_id, scope_id, granted)
                    SELECT $1, $2, s.id, TRUE
                    FROM auth.scope s
                    JOIN auth.client_scope cs ON s.id = cs.scope_id AND cs.client_id = $1
                    WHERE s.value = ANY($3::text[])
                    ON CONFLICT DO NOTHING
                `, [internalClientId, roleId, dataScope]);
                scopesAdded = insertRes.rowCount || 0;
            }

            // 5. Priority 2: Fallback to copying from Global Role's own assignments for this client
            // This is useful if the admin has manually customized the "Global" version of the role in the UI
            if (scopesAdded === 0 && globalRoleId) {
                const fallbackRes = await this.db.query(`
                    INSERT INTO auth.client_role_scope (client_id, role_id, scope_id, granted)
                    SELECT $1, $2, scope_id, TRUE
                    FROM auth.client_role_scope
                    WHERE client_id = $1 AND role_id = $3 AND granted = TRUE
                    ON CONFLICT DO NOTHING
                `, [internalClientId, roleId, globalRoleId]);
                scopesAdded = fallbackRes.rowCount || 0;
            }

            return this.ok(res, RESPONSE_TYPES.SUCCESS, { 
                message: "Role synchronized with Global Template",
                scopesCount: scopesAdded
            });
        } catch (error) {
            console.error("[RoleScopeController.syncTemplate]", error);
            return this.internalservererror(res, "Sync failed");
        }
    }
}

export default RoleScopeController;
