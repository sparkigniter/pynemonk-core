import * as express from "express";
import { container } from "tsyringe";
import BaseController from "./BaseController.js";
import { UserContext, AuthenticatedRequest } from "../middleware/AuthMiddleware.js";
import { DataScopeHelper, DataScope } from "../helpers/DataScopeHelper.js";

class ResourceController extends BaseController {
    protected scopeHelper: DataScopeHelper;

    constructor() {
        super();
        this.scopeHelper = container.resolve(DataScopeHelper);
    }

    /** Extract user context and resolve effective data scope */
    protected async getScope(req: express.Request): Promise<DataScope> {
        const user = (req as AuthenticatedRequest).user;
        if (!user) throw new Error("Unauthorized: No user context found");
        return this.scopeHelper.resolveScope(user);
    }
}

export default ResourceController;
