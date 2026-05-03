import { injectable, inject } from "tsyringe";
import { TokenPayload, TokenResponse } from "../types/Token.js";
import jwt from "jsonwebtoken";
import UserHelper from "../api/modules/oauth2/helpers/UserHelper.js";
import bcrypt from "bcrypt";

@injectable()
class TokenService {

    private JWT_ACCESS_SECRET: string = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback_access_secret_32_chars_long';
    private JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_32_chars_long';

    private accessTokenExpiryTime: number = 3600; // 1 hour

    private refreshTokenExpiryTime: number = 604800; // 7 days

    private userHelper: UserHelper;
    constructor(@inject(UserHelper) userHelper: UserHelper) {
        this.userHelper = userHelper;
    }

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
        return jwt.sign(token, this.JWT_ACCESS_SECRET, {
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
        return jwt.sign(token, this.JWT_REFRESH_SECRET, {
            expiresIn: this.refreshTokenExpiryTime,
            algorithm: "HS256"
        });
    }

    /**
     * Standard Token Pair Generator (Legacy compatibility)
     */
    public generateTokenPair(tokenPayload: TokenPayload): TokenResponse {
        const accessToken = this.generateToken(tokenPayload);
        const refreshToken = this.generateRefreshToken(tokenPayload);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: "Bearer",
            expires_in: this.accessTokenExpiryTime
        };
    }

    /**
     * Token Pair Generator (Identity Aware)
     * Optimized for login grants to include full RBAC context.
     */
    public async generateIdentityTokenPair(email: string, clientId: string, prefetchedContext?: any): Promise<TokenResponse> {
        const context = prefetchedContext || await this.userHelper.getIdentityContext(email, clientId);
        if (!context) throw new Error("User identity not found");

        const payload: any = {
            sub: context.user_id,
            email: context.email,
            tenant_id: context.tenant_id,
            roles: context.roles.map((r: any) => r.slug), // Extract slugs for easy checking
            scope: context.permissions.join(" "),
            iat: Math.floor(Date.now() / 1000)
        };

        const accessToken = jwt.sign(payload, this.JWT_ACCESS_SECRET, {
            expiresIn: this.accessTokenExpiryTime,
            algorithm: "HS256"
        });

        const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
            expiresIn: this.refreshTokenExpiryTime,
            algorithm: "HS256"
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: "Bearer",
            expires_in: this.accessTokenExpiryTime
        };
    }

    public async verifyPassword(username: string, password: string): Promise<any> {
        // get user from database
        const user = await this.userHelper.getUserCredential(username);
        if (!user) {
            throw new Error("Invalid credentials");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid credentials");
        }
        return user;
    }
}

export default TokenService;