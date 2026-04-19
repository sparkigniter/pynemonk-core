import { injectable, inject } from "tsyringe";
import TokenService from "../../../../services/TokenService.js";
import GrantHandler from "../../../interfaces/GrantHandler.js";
import type { TokenPayload, TokenResponse } from "../../../../types/Token.js";

/**
 * implicit grant.
 * Note: Implicit grant is deprecated in OAuth 2.1. Included here for
 * backward compatibility only. Issues only an access token.
 */
@injectable()
class ImplicitGrantHandler implements GrantHandler {

    constructor(@inject(TokenService) private tokenService: TokenService) {}

    public async handle(tokenPayload: TokenPayload): Promise<TokenResponse> {
        const accessToken = this.tokenService.generateToken(tokenPayload);
        return {
            accessToken,
            refreshToken: "",
            tokenType: "Bearer",
            expiresIn: 3600,
        };
    }
}

export default ImplicitGrantHandler;
