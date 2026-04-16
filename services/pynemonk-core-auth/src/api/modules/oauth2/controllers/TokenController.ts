import e from "express";
import BaseController from "../../../core/controllers/BaseController.ts";
import ClientModel from "../models/ClientModel.ts";
import GrantHandlerFactory from "../factory/GrantHandlerFactory.ts";

class TokenController extends BaseController {

    private clientModel: ClientModel;
    private grantFactory: GrantHandlerFactory;

    constructor(clientModel: ClientModel, grantFactory: GrantHandlerFactory) {
        super();
        this.clientModel = clientModel;
        this.grantFactory = grantFactory;
    }

    /**
     * Issue a new token
     * @param req 
     * @param res 
     * @returns 
     */
    public async issueToken(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            // Implement token issuance logic here
            const clientSecret = await this.clientModel.getClientSecret(req.body.client_id);
            if (!clientSecret) {
                return this.badrequest(res, "Invalid client_id");
            }
            if (clientSecret !== req.body.client_secret) {
                return this.badrequest(res, "Invalid client_secret");
            }
            const grantHandler = this.grantFactory.getHandler(req.body.grant_type);
            const tokenResponse = await grantHandler.handle(req.body);

            return this.ok(res, tokenResponse);
        } catch (error) {
            return this.badrequest(res, error instanceof Error ? error.message : "An error occurred while issuing token");
        }
    }
}

export default TokenController;