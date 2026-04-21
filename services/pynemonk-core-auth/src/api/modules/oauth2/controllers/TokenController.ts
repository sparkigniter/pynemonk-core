import e from "express";
import { injectable, inject } from "tsyringe";
import BaseController from "../../../core/controllers/BaseController.js";
import ClientModel from "../models/ClientModel.js";
import GrantHandlerFactory from "../factory/GrantHandlerFactory.js";
import { RESPONSE_TYPES } from "../../../../constants/constants.js";
import ValidationError from "../../../errors/ValidationError.js";

/**
 * TokenController — handles POST /api/v1/oauth2/token
 *
 * Supported grant_type values:
 *   - authorization_code
 *   - client_credentials
 *   - password
 *   - refresh_token
 *   - implicit
 */
@injectable()
class TokenController extends BaseController {

    constructor(@inject(ClientModel) private clientModel: ClientModel, @inject(GrantHandlerFactory) private grantFactory: GrantHandlerFactory,) {
        super();
    }

    /**
     * Issue a new token.
     * Body must contain: { client_id, client_secret, grant_type, ...grant-specific fields }
     */
    public async issueToken(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const { client_id, client_secret, grant_type } = req.body;

            if (!client_id || !client_secret || !grant_type) {
                return this.badrequest(res, "client_id, client_secret and grant_type are required");
            }

            // Verify client credentials
            let storedSecret: string;
            try {
                storedSecret = await this.clientModel.getClientSecret(client_id);
            } catch {
                return this.badrequest(res, "Invalid client_id");
            }

            if (storedSecret !== client_secret) {
                console.log("Invalid client_secret, token controller");
                return this.unautharized(res, "Invalid client_secret");
            }

            // Dispatch to the correct grant handler
            const handler = this.grantFactory.getHandler(grant_type);
            console.log("Token handler: ", handler);
            console.log("Token request body: ", req.body);
            const tokenResponse = await handler.handle(req.body);

            return this.ok(res, RESPONSE_TYPES.SUCCESS, {
                access_token: tokenResponse.access_token,
                refresh_token: tokenResponse.refresh_token || undefined,
                token_type: tokenResponse.token_type,
                expires_in: tokenResponse.expires_in,
            });
        } catch (error) {
            if (error instanceof ValidationError) {
                return this.badrequest(res, error.message);
            }
            return this.badrequest(
                res,
                error instanceof Error ? error.message : "An error occurred while issuing token"
            );
        }
    }
}

export default TokenController;