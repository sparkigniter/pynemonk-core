import { TokenPayload, TokenResponse } from "../../../../types/Token.ts";
import GrantHandler from "../../../interfaces/GrantHandler.ts";
import TokenService from "../../../../services/TokenService.ts";

class AuthorizationCodeGrantHandler implements GrantHandler {


    public async handle(tokenPayload: TokenPayload): Promise<TokenResponse> {
        return this.tokenService.generateTokenPair(tokenPayload);
    }
}

export default AuthorizationCodeGrantHandler;
