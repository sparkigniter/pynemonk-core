import e from "express";
import jwt from "jsonwebtoken";
import BaseController from "../../../core/controllers/BaseController.js";
import { injectable } from "tsyringe";

/**
 * IntrospectController — token introspection endpoint (RFC 7662 inspired).
 * POST /api/v1/auth/introspect
 * Body: { token: string }
 * Returns: { active, sub, email, role_id, client_id, scope, iat, exp } or { active: false }
 */
@injectable()
class IntrospectController extends BaseController {

    constructor() {
        super();
    }

    public async introspect(req: e.Request, res: e.Response): Promise<e.Response> {
        const { token } = req.body;
        if (!token) {
            return this.badrequest(res, "token is required");
        }

        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret) {
            return this.internalservererror(res, "Server misconfiguration");
        }

        try {
            const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as any;
            return this.ok(res, "success", {
                active:    true,
                sub:       decoded.sub,
                email:     decoded.email,
                role_id:   decoded.role_id,
                client_id: decoded.client_id,
                scope:     decoded.scope ?? null,
                iat:       decoded.iat,
                exp:       decoded.exp,
            });
        } catch (err) {
            // Don't expose the reason — just return inactive
            return this.ok(res, "success", { active: false });
        }
    }
}

export default IntrospectController;
