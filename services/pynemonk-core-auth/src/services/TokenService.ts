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
     * Token Pair Generator
     * @param tokenPayload 
     * @returns 
     */
    public generateTokenPair(tokenPayload: TokenPayload): TokenResponse {
        const accessToken: string = this.generateToken(tokenPayload);
        const refreshToken: string = this.generateRefreshToken(tokenPayload);
        return {
            accessToken: accessToken,
            refreshToken: refreshToken,
            tokenType: "Bearer",
            expiresIn: this.accessTokenExpiryTime
        };
    }

    public async verifyPassword(username: string, password: string): Promise<any> {
        // get user from database
        const user = await this.userHelper.getUserCredential(username);
        if (!user) {
            throw new Error("Invalid credentials");
        }
        console.log("User found:", user);
        console.log("Password:", password);
        console.log("Hashed Password:", user.password);
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid credentials");
        }
        return user;
    }
}

export default TokenService;