import "reflect-metadata";
import * as express from "express";
import { container } from "tsyringe";
import AuthController from "./controllers/AuthController.js";
import IntrospectController from "./controllers/IntrospectController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";

const authRouter = express.Router();

/**
 * POST /api/v1/auth/register
 * Register a new user.
 */
authRouter.post("/register", (req, res) => {
    const ctrl = container.resolve(AuthController);
    return ctrl.register(req, res);
});

/**
 * POST /api/v1/auth/login
 * Login with email + password (plus OAuth2 client credentials).
 * Returns access_token + refresh_token.
 */
authRouter.post("/login", (req, res) => {
    const ctrl = container.resolve(AuthController);
    return ctrl.login(req, res);
});

/**
 * POST /api/v1/auth/refresh
 * Rotate a refresh token.
 * Body: { refresh_token, client_id, client_secret }
 */
authRouter.post("/refresh", (req, res) => {
    const ctrl = container.resolve(AuthController);
    return ctrl.refresh(req, res);
});

/**
 * POST /api/v1/auth/logout
 * Revoke all refresh tokens for the current user.
 * Requires valid Bearer token in Authorization header.
 */
authRouter.post("/logout", requireAuth, (req, res) => {
    const ctrl = container.resolve(AuthController);
    return ctrl.logout(req, res);
});

/**
 * POST /api/v1/auth/introspect
 * Introspect an access token (RFC 7662 inspired).
 * Body: { token }
 */
authRouter.post("/introspect", (req, res) => {
    const ctrl = container.resolve(IntrospectController);
    return ctrl.introspect(req, res);
});

export default authRouter;
