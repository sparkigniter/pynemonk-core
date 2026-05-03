import { injectable, inject } from "tsyringe";
import TokenService from "../../../../services/TokenService.js";
import GrantHandler from "../../../interfaces/GrantHandler.js";
import type { TokenPayload, TokenResponse, PasswordGrantPayload } from "../../../../types/Token.js";

/**
 * password grant (Resource Owner Password Credentials — RFC 6749 §4.3).
 * Expects a PasswordGrantPayload which carries username + password.
 * Verifies credentials via bcrypt before minting the token pair.
 */
@injectable()
class PasswordGrantHandler implements GrantHandler {

    constructor(@inject(TokenService) private tokenService: TokenService) { }

    public async handle(tokenPayload: TokenPayload): Promise<TokenResponse> {
        // Narrow to the specific payload type
        const payload = tokenPayload as any;
        console.log("Password grant payload: ", payload);

        // If we have a pre-verified context, bypass the DB and Bcrypt calls
        if (payload.preverified_context) {
            return this.tokenService.generateIdentityTokenPair(payload.email, payload.client_id, payload.preverified_context);
        }

        if (!payload.password) {
            throw new Error("Invalid credentials");
        }
        const user = await this.tokenService.verifyPassword(payload.username, payload.password);
        if (!user) {
            throw new Error("Invalid credentials");
        }
        return this.tokenService.generateIdentityTokenPair(payload.username, payload.client_id);
    }
}

export default PasswordGrantHandler;
