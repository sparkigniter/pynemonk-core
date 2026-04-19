import { injectable, inject } from "tsyringe";
import TokenService from "../../../../services/TokenService.js";
import GrantHandler from "../../../interfaces/GrantHandler.js";
import AuthorizationCodeGrantHandler from "../handlers/AuthorizationCodeGrantHandler.js";
import ClientCredentialsGrantHandler from "../handlers/ClientCredentialsGrantHandler.js";
import PasswordGrantHandler from "../handlers/PasswordGrantHandler.js";
import RefreshTokenGrantHandler from "../handlers/RefreshTokenGrantHandler.js";
import ImplicitGrantHandler from "../handlers/ImplicitGrantHandler.js";

/**
 * GrantHandlerFactory — resolves the correct grant handler by grant_type string.
 * Handlers are injected via constructor so tsyringe manages their dependencies.
 */
@injectable()
class GrantHandlerFactory {

    private grantHandlers: Map<string, GrantHandler>;

    constructor(@inject(AuthorizationCodeGrantHandler) private authorizationCodeHandler: AuthorizationCodeGrantHandler, @inject(ClientCredentialsGrantHandler) private clientCredentialsHandler: ClientCredentialsGrantHandler, @inject(PasswordGrantHandler) private passwordHandler: PasswordGrantHandler, @inject(RefreshTokenGrantHandler) private refreshTokenHandler: RefreshTokenGrantHandler, @inject(ImplicitGrantHandler) private implicitHandler: ImplicitGrantHandler, ) {
        this.grantHandlers = new Map<string, GrantHandler>([
            ["authorization_code", this.authorizationCodeHandler],
            ["client_credentials", this.clientCredentialsHandler],
            ["password",           this.passwordHandler],
            ["refresh_token",      this.refreshTokenHandler],
            ["implicit",           this.implicitHandler],
        ]);
    }

    public getHandler(grantType: string): GrantHandler {
        const handler = this.grantHandlers.get(grantType);
        if (!handler) {
            throw new Error(`Unsupported grant_type: "${grantType}". ` +
                `Supported: ${[...this.grantHandlers.keys()].join(", ")}`);
        }
        return handler;
    }
}

export default GrantHandlerFactory;
