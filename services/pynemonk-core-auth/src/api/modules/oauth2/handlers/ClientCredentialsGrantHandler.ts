import { injectable, inject } from "tsyringe";
import TokenService from "../../../../services/TokenService.js";
import GrantHandler from "../../../interfaces/GrantHandler.js";
import type { TokenPayload, TokenResponse, ClientCredentialsPayload } from "../../../../types/Token.js";

/**
 * client_credentials grant — machine-to-machine, no user involved.
 * Issues only an access token (no refresh token in the response).
 */
@injectable()
class ClientCredentialsGrantHandler implements GrantHandler {

    constructor(@inject(TokenService) private tokenService: TokenService) {}

    public async handle(tokenPayload: TokenPayload): Promise<TokenResponse> {
        const payload = tokenPayload as ClientCredentialsPayload;
        // client_credentials issues only an access token — no refresh token
        const accessToken = this.tokenService.generateToken(payload);
        return {
            accessToken,
            refreshToken: "",
            tokenType: "Bearer",
            expiresIn: 3600,
        };
    }
}

export default ClientCredentialsGrantHandler;
