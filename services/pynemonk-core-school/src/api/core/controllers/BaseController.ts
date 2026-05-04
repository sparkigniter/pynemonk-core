import * as express from "express";
import ApiResponseHandler from "../ApiResponseHandler.js";

import { UserContext, AuthenticatedRequest } from "../middleware/AuthMiddleware.js";

class BaseController {
    constructor() {}

    /** Get tenant ID from user context */
    protected getTenantId(req: express.Request): number {
        const user = (req as AuthenticatedRequest).user;
        if (!user) throw new Error("Unauthorized: No user context found");
        return user.tenantId;
    }

    public unautharized(res: express.Response, message?: string): express.Response {
        return ApiResponseHandler.unautharized(res, message);
    }

    public ok(res: express.Response, message?: string, data?: any): express.Response {
        return ApiResponseHandler.ok(res, message, data);
    }

    public badrequest(res: express.Response, message?: string): express.Response {
        return ApiResponseHandler.badrequest(res, message);
    }

    public forbidden(res: express.Response, message?: string): express.Response {
        return ApiResponseHandler.forbidden(res, message);
    }

    public internalservererror(res: express.Response, message?: string): express.Response {
        const jsonRes: JSON = ApiResponseHandler.jsonResponse({
            message: message ?? "Internal Server Error",
            success: false,
        });
        return res.status(500).json(jsonRes);
    }

    public notfound(res: express.Response, message?: string): express.Response {
        const jsonRes: JSON = ApiResponseHandler.jsonResponse({
            message: message ?? "Not Found",
            success: false,
        });
        return res.status(404).json(jsonRes);
    }
}

export default BaseController;
