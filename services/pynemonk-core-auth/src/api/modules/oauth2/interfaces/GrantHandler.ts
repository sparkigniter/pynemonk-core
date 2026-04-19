import { TokenPayload, TokenResponse } from "../../../../types/Token.js";

interface GrantHandler {
    handle(tokenPayload: TokenPayload): Promise<TokenResponse>;
}

export default GrantHandler;