
import AuthorizationCodeGrantHandler from "../handlers/AuthorizationCodeGrantHandler.ts";
import ClientCredentialsGrantHandler from "../handlers/ClientCredentialsGrantHandler.ts";
import PasswordGrantHandler from "../handlers/PasswordGrantHandler.ts";
import RefreshTokenGrantHandler from "../handlers/RefreshTokenGrantHandler.ts";
import ImplicitGrantHandler from "../handlers/ImplicitGrantHandler.ts";
import { inject, injectable } from "tsyringe";

@injectable()
class GrantHandlerFactory {

    private grantHandlers: Map<string, GrantHandler> = new Map(
        "authorization_code": new AuthorizationCodeGrantHandler(),
        "client_credentials": new ClientCredentialsGrantHandler(),
        "password": new PasswordGrantHandler(),
        "refresh_token": new RefreshTokenGrantHandler(),
        "implicit": new ImplicitGrantHandler(),
    );

    public getHandler(grant: string) {
        const handler = this.grantHandlers.get(grant);
        if (!handler) {
            throw new Error(`Unsupported grant type: ${grant}`);
        }
        return handler;
    }
}

export default GrantHandlerFactory;

