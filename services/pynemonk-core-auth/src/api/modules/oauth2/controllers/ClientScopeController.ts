import BaseController from "../../../core/controllers/BaseController.js";
import { injectable, inject } from "tsyringe";
import ClientScopeModel from "../models/ClientScopeModel.js";
import ValidationError from "../../../errors/ValidationError.js";

@injectable()
class ClientScopeController extends BaseController {

    private clientScopeModel: ClientScopeModel;
    private db: any;

    constructor(
        @inject(ClientScopeModel) clientScopeModel: ClientScopeModel,
        @inject("DB") db: any
    ) {
        super();
        this.clientScopeModel = clientScopeModel;
        this.db = db;
    }

    /**
     * Create a new client scope
     * @param req 
     * @param res 
     * @returns 
     */
    public async create(req: any, res: any): Promise<any> {
        try {
            this.clientScopeModel.setScenario("CREATE_CLIENT_SCOPE"); // Set the scenario for validation
            if (!await this.clientScopeModel.validate(req.body)) {
                return this.badrequest(res);
            }
            const responseData = await this.clientScopeModel.save(req.body, true); // skip validation as it is already done above       
            return this.ok(res, "Scope associated with client successfully", responseData);
        } catch (error) {
            if (error instanceof ValidationError) {
                return this.badrequest(res, error.message);
            }
            return this.internalservererror(res, "An error occurred while associating scope with client");
        }
    }

    /**
     * Get all client scopes
     */
    public async getAll(req: any, res: any): Promise<any> {
        try {
            const data = await this.clientScopeModel.getAll();
            return this.ok(res, "Client scopes fetched successfully", data);
        } catch (error) {
            return this.internalservererror(res, "An error occurred while fetching client scopes");
        }
    }

    /**
     * Delete a client scope
     */
    public async delete(req: any, res: any): Promise<any> {
        try {
            const { clientId, scopeId } = req.params;
            if (!clientId || !scopeId) {
                return this.badrequest(res, "Missing parameters");
            }
            await this.clientScopeModel.delete(clientId, scopeId);
            return this.ok(res, "Scope removed from client successfully");
        } catch (error) {
            return this.internalservererror(res, "An error occurred while removing scope from client");
        }
    }
    /**
     * Provision a client with all scopes from a role template
     */
    public async syncTemplate(req: any, res: any): Promise<any> {
        try {
            const { clientId, roleSlug } = req.body;
            if (!clientId || !roleSlug) {
                return this.badrequest(res, "Missing clientId or roleSlug");
            }

            // 1. Check DB
            if (!this.db) return this.internalservererror(res, "DB connection missing");

            // 2. Get the template scopes (Prefer client-specific template, fallback to global)
            const templateRes = await this.db.query(`
                SELECT data_scope FROM auth.role_template 
                WHERE slug = $1 
                AND (
                    (client_id = (SELECT id FROM auth.client WHERE client_id = $2))
                    OR client_id IS NULL
                )
                ORDER BY client_id DESC NULLS LAST
                LIMIT 1
            `, [roleSlug, clientId]);
            if (templateRes.rows.length === 0) return this.badrequest(res, "No template found for this role/client combination");
            
            const templateScopes: string[] = templateRes.rows[0].data_scope;
            if (!templateScopes || templateScopes.length === 0) return this.ok(res, "Template is empty");

            // 3. Resolve scope IDs
            const scopeIdsRes = await this.db.query("SELECT id FROM auth.scope WHERE value = ANY($1)", [templateScopes]);
            const scopeIds = scopeIdsRes.rows.map((r: any) => r.id);

            // 4. Batch Provision (Using the new Client-Role-Scope triadic architecture)
            const roleIdRes = await this.db.query("SELECT id FROM auth.role WHERE slug = $1 AND tenant_id IS NULL", [roleSlug]);
            if (roleIdRes.rows.length === 0) return this.badrequest(res, "Role not found");
            const roleId = roleIdRes.rows[0].id;
            
            const clientInfoRes = await this.db.query("SELECT id FROM auth.client WHERE client_id = $1", [clientId]);
            if (clientInfoRes.rows.length === 0) return this.badrequest(res, "Client not found");
            const internalClientId = clientInfoRes.rows[0].id;

            // OVERWRITE: Clear existing permissions for this App-Role pair first
            await this.db.query("DELETE FROM auth.client_role_scope WHERE client_id = $1 AND role_id = $2", [internalClientId, roleId]);

            for (const scopeId of scopeIds) {
                await this.db.query(`
                    INSERT INTO auth.client_role_scope (client_id, role_id, scope_id, granted)
                    VALUES ($1, $2, $3, TRUE)
                    ON CONFLICT (client_id, role_id, scope_id) DO UPDATE SET granted = TRUE
                `, [internalClientId, roleId, scopeId]);
            }

            // 5. Also auto-tag the role to the client for authorization
            await this.db.query(`
                INSERT INTO auth.client_role (client_id, role_id)
                VALUES ($1, $2)
                ON CONFLICT (client_id, role_id) DO NOTHING
            `, [internalClientId, roleId]);

            return this.ok(res, `Provisioned the ${roleSlug} role in this client with ${scopeIds.length} app-specific scopes.`);
        } catch (error) {
            console.error("[ClientScopeController.syncTemplate]", error);
            return this.internalservererror(res, "An error occurred while provisioning client template");
        }
    }
    /**
     * Grant all existing scopes to a client
     */
    public async bulkGrant(req: any, res: any): Promise<any> {
        try {
            const { clientId } = req.body;
            if (!clientId) return this.badrequest(res, "Missing clientId");

            await this.db.query(`
                INSERT INTO auth.client_scope (client_id, scope_id)
                SELECT $1, id FROM auth.scope
                ON CONFLICT (client_id, scope_id) DO NOTHING
            `, [clientId]);

            return this.ok(res, "All scopes granted to client successfully");
        } catch (error) {
            return this.internalservererror(res, "An error occurred during bulk grant");
        }
    }

    /**
     * Revoke all scopes from a client
     */
    public async bulkRevoke(req: any, res: any): Promise<any> {
        try {
            const { clientId } = req.body;
            if (!clientId) return this.badrequest(res, "Missing clientId");

            await this.db.query("DELETE FROM auth.client_scope WHERE client_id = $1", [clientId]);
            return this.ok(res, "All scopes revoked from client successfully");
        } catch (error) {
            return this.internalservererror(res, "An error occurred during bulk revoke");
        }
    }
    /**
     * Remove all scopes from a client that belong to a specific role template
     */
    public async deprovisionTemplate(req: any, res: any): Promise<any> {
        try {
            const { clientId, roleSlug } = req.body;
            if (!clientId || !roleSlug) {
                return this.badrequest(res, "Missing clientId or roleSlug");
            }

            // 1. Get the template scopes
            const templateRes = await this.db.query("SELECT data_scope FROM auth.role_template WHERE slug = $1", [roleSlug]);
            if (templateRes.rows.length === 0) return this.badrequest(res, "No template found for this role type");
            
            const templateScopes: string[] = templateRes.rows[0].data_scope;
            if (!templateScopes || templateScopes.length === 0) return this.ok(res, "Template is empty");

            // 2. Resolve scope IDs
            const scopeIdsRes = await this.db.query("SELECT id FROM auth.scope WHERE value = ANY($1)", [templateScopes]);
            const scopeIds = scopeIdsRes.rows.map((r: any) => r.id);

            // 3. Batch Remove
            await this.db.query(`
                DELETE FROM auth.client_scope 
                WHERE client_id = $1 AND scope_id = ANY($2)
            `, [clientId, scopeIds]);

            // 4. Also un-tag the role from the client
            const roleRes = await this.db.query("SELECT id FROM auth.role WHERE slug = $1 AND tenant_id IS NULL", [roleSlug]);
            if (roleRes.rows.length > 0) {
                const roleId = roleRes.rows[0].id;
                await this.db.query("DELETE FROM auth.client_role WHERE client_id = $1 AND role_id = $2", [clientId, roleId]);
            }

            return this.ok(res, `Removed ${scopeIds.length} scopes and de-authorized the ${roleSlug} role from this client.`);
        } catch (error) {
            console.error("[ClientScopeController.deprovisionTemplate]", error);
            return this.internalservererror(res, "An error occurred while deprovisioning client template");
        }
    }
}

export default ClientScopeController;