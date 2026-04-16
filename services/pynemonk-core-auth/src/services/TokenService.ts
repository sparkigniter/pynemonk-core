import { injectable } from "tsyringe";
import { TokenPayload, TokenResponse } from "../types/Token.ts";
import jwt from "jsonwebtoken";

@injectable()
class TokenService {

    private JWT_ACCESS_SECRET: string = process.env.JWT_ACCESS_SECRET!;

    private accessTokenExpiryTime: number = 3600; // 1 hour

    private refreshTokenExpiryTime: number = 604800; // 7 days


    /**
     * Access Token Generator
     * @param tokenPayload 
     * @returns 
     */
    public generateToken(tokenPayload: TokenPayload): string {

        const token: TokenPayload = {
            ...tokenPayload,
            iat: Math.floor(Date.now() / 1000)

        }
        return jwt.sign(token, process.env.JWT_ACCESS_SECRET!, {
            expiresIn: this.accessTokenExpiryTime,
            algorithm: "HS256"
        });
    }

    /**
     * Refresh Token Generator
     * @param tokenPayload 
     * @returns 
     */
    public generateRefreshToken(tokenPayload: TokenPayload): string {

        const token: TokenPayload = {
            ...tokenPayload,
            iat: Math.floor(Date.now() / 1000)

        }
        return jwt.sign(token, process.env.JWT_REFRESH_SECRET!, {
            expiresIn: this.refreshTokenExpiryTime,
            algorithm: "HS256"
        });
    }

    /**
     * Token Pair Generator
     * @param tokenPayload 
     * @returns 
     */
    public generateTokenPair(tokenPayload: TokenPayload): TokenResponse {
        const accessToken = this.generateToken(tokenPayload);
        const refreshToken = this.generateRefreshToken(tokenPayload);
        return {
            accessToken: accessToken,
            refreshToken: refreshToken,
            tokenType: "Bearer",
            expiresIn: this.accessTokenExpiryTime
        };
    }
}

export default TokenService;