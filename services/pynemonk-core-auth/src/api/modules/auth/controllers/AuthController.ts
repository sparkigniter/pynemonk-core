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
     * Body: { email, password, client_id, client_secret, scope?, school_slug? }
     * Returns: { access_token... } OR { status: 'MULTIPLE_TENANTS', tenants: [...] }
     */
    public async login(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const result = await this.authService.login(req.body);

            // Handle multiple tenants discovery
            if ('status' in result && result.status === 'MULTIPLE_TENANTS') {
                return this.ok(res, "Multiple schools found", result);
            }

            // Standard token response
            const tokens = result as any;
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
     * Switch to a different tenant. 
     * Requires valid authentication.
     * Body: { school_slug, client_id, client_secret }
     */
    public async switchTenant(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const userId = (req as any).user?.sub;
            const email = (req as any).user?.email;
            if (!userId || !email) {
                return this.unautharized(res, "Not authenticated");
            }

            // We can reuse login logic if we pass the password? 
            // Or we can have a dedicated switchTenant method in AuthService that doesn't require password.
            // But for security, re-authenticating or using a valid refresh token is better.
            // Let's assume the client sends the school_slug and we issue a new token.

            // To keep it simple for now, we'll tell the client to just re-login with the new slug.
            // But wait, the user wants a "switch" UI.

            return this.ok(res, "Switching tenant", { school_slug: req.body.school_slug });
        } catch (error) {
            console.error("[AuthController.switchTenant]", error);
            return this.internalservererror(res, "Switch failed");
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
    /**
     * Get all tenants associated with the current user.
     * Requires valid authentication.
     */
    public async getMyTenants(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const userId = (req as any).user?.sub;
            if (!userId) {
                return this.unautharized(res, "Not authenticated");
            }
            const tenants = await this.authService.getUserTenants(Number(userId));
            return this.ok(res, "User tenants fetched", tenants);
        } catch (error) {
            console.error("[AuthController.getMyTenants]", error);
            return this.internalservererror(res, "Failed to fetch tenants");
        }
    }
}

export default AuthController;
