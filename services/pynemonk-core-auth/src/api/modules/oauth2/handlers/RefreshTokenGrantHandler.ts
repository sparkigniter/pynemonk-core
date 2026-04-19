import { injectable, inject } from "tsyringe";
import TokenService from "../../../../services/TokenService.js";
import GrantHandler from "../../../interfaces/GrantHandler.js";
import type { TokenPayload, TokenResponse, RefreshTokenPayload } from "../../../../types/Token.js";

/**
 * refresh_token grant.
 * The TokenController validates the existing refresh token before calling this handler.
 * This handler only generates the new token pair.
 */
@injectable()
class RefreshTokenGrantHandler implements GrantHandler {

    constructor(@inject(TokenService) private tokenService: TokenService) {}

    public async handle(tokenPayload: TokenPayload): Promise<TokenResponse> {
        const payload = tokenPayload as RefreshTokenPayload;
        return this.tokenService.generateTokenPair(payload);
    }
}

export default RefreshTokenGrantHandler;
