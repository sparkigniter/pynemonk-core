import { TokenPayload, TokenResponse } from "../../../../types/Token.ts";

interface GrantHandler {
    handle(tokenPayload: TokenPayload): Promise<TokenResponse>;
}

export default GrantHandler;