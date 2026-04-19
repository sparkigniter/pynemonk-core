import 'reflect-metadata';
import e from "express";
import { injectable, inject } from "tsyringe";
import BaseController from "../../../core/controllers/BaseController.js";
import AuthService from "../services/AuthService.js";
import ValidationError from "../../../errors/ValidationError.js";
import { RESPONSE_TYPES } from "../../../../constants/constants.js";

/**
 * AuthController — exposes register / login / refresh / logout over HTTP.
 *
 * Routes (mounted under /api/v1/auth):
 *   POST /register
 *   POST /login
 *   POST /refresh
 *   POST /logout
 */
@injectable()
class AuthController extends BaseController {

    constructor(@inject(AuthService) private authService: AuthService) {
        super();
    }

    /**
     * Register a new user.
     * Body: { email, password, role_id, first_name?, last_name?, phone? }
     */
    public async register(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const user = await this.authService.register(req.body);
            return this.ok(res, "User registered successfully", user);
        } catch (error) {
            if (error instanceof ValidationError) {
                return this.badrequest(res, error.message);
            }
            console.error("[AuthController.register]", error);
            return this.internalservererror(res, "Registration failed");
        }
    }

    /**
     * Login with email + password, validated against an OAuth client.
     * Body: { email, password, client_id, client_secret, scope? }
     * Returns: { access_token, refresh_token, token_type, expires_in }
     */
    public async login(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const tokens = await this.authService.login(req.body);
            return this.ok(res, RESPONSE_TYPES.SUCCESS, {
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                token_type: tokens.tokenType,
                expires_in: tokens.expiresIn,
            });
        } catch (error) {
            if (error instanceof ValidationError) {
                return this.badrequest(res, error.message);
            }
            console.error("[AuthController.login]", error);
            return this.internalservererror(res, "Login failed");
        }
    }

    /**
     * Rotate a refresh token.
     * Body: { refresh_token, client_id, client_secret }
     */
    public async refresh(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const tokens = await this.authService.refreshTokens(req.body);
            return this.ok(res, RESPONSE_TYPES.SUCCESS, {
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                token_type: tokens.tokenType,
                expires_in: tokens.expiresIn,
            });
        } catch (error) {
            if (error instanceof ValidationError) {
                return this.badrequest(res, error.message);
            }
            console.error("[AuthController.refresh]", error);
            return this.internalservererror(res, "Token refresh failed");
        }
    }

    /**
     * Logout — revoke all refresh tokens for the authenticated user.
     * Requires a valid access token; the middleware decodes it and sets req.user.
     * Body: (empty — user id comes from the verified JWT via middleware)
     */
    public async logout(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const userId = (req as any).user?.sub;
            if (!userId) {
                return this.unautharized(res, "Not authenticated");
            }
            await this.authService.logout(Number(userId));
            return this.ok(res, "Logged out successfully");
        } catch (error) {
            console.error("[AuthController.logout]", error);
            return this.internalservererror(res, "Logout failed");
        }
    }
}

export default AuthController;
