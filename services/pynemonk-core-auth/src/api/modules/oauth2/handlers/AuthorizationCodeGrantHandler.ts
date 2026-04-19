import { injectable, inject } from "tsyringe";
import TokenService from "../../../../services/TokenService.js";
import GrantHandler from "../../../interfaces/GrantHandler.js";
import type { TokenPayload, TokenResponse, AuthorizationCodePayload } from "../../../../types/Token.js";

/**
 * authorization_code grant — exchanges a client_id/secret for a token pair.
 * In a full OIDC flow this would also validate the `code` parameter.
 * For now it issues a token pair using the supplied payload claims.
 */
@injectable()
class AuthorizationCodeGrantHandler implements GrantHandler {

    constructor(@inject(TokenService) private tokenService: TokenService) {}

    public async handle(tokenPayload: TokenPayload): Promise<TokenResponse> {
        const payload = tokenPayload as AuthorizationCodePayload;
        // TODO: validate payload.code against the authorization server before minting
        return this.tokenService.generateTokenPair(payload);
    }
}

export default AuthorizationCodeGrantHandler;
