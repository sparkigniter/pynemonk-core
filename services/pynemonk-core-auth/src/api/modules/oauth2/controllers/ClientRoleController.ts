import e from "express";
import BaseController from "../../../core/controllers/BaseController.js";
import { injectable, inject } from "tsyringe";
import { RESPONSE_TYPES } from '../../../../constants/constants.js';

@injectable()
class ClientRoleController extends BaseController {

    protected db: any;

    constructor(@inject("DB") DB: any) {
        super();
        this.db = DB;
    }

    public async getAll(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const query = `
                SELECT cr.id, cr.client_id, cr.role_id, r.name as role_name, r.slug as role_slug
                FROM auth.client_role cr
                JOIN auth.role r ON cr.role_id = r.id
            `;
            const result = await this.db.query(query);
            return this.ok(res, RESPONSE_TYPES.SUCCESS, result.rows);
        } catch (error) {
            return this.internalservererror(res, "Failed to fetch client roles");
        }
    }

    public async create(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const { client_id, role_id } = req.body;
            if (!client_id || !role_id) return this.badrequest(res, "Missing fields");

            const query = `
                INSERT INTO auth.client_role (client_id, role_id)
                VALUES ($1, $2)
                ON CONFLICT (client_id, role_id) DO NOTHING
                RETURNING *
            `;
            const result = await this.db.query(query, [client_id, role_id]);
            return this.ok(res, RESPONSE_TYPES.SUCCESS, result.rows[0]);
        } catch (error) {
            return this.internalservererror(res, "Failed to assign role to client");
        }
    }

    public async delete(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const { clientId, roleId } = req.params;
            const query = `DELETE FROM auth.client_role WHERE client_id = $1 AND role_id = $2`;
            await this.db.query(query, [clientId, roleId]);
            return this.ok(res, RESPONSE_TYPES.SUCCESS, { message: "Role removed from client" });
        } catch (error) {
            return this.internalservererror(res, "Failed to remove role from client");
        }
    }
}

export default ClientRoleController;
