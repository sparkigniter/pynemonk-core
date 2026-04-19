import "reflect-metadata";
import { Router } from "express";
import setupDI from "./di.js";
import oauthRouter from "./api/modules/oauth2/routes.js";
import authRouter from "./api/modules/auth/routes.js";
import tenantRouter from "./api/modules/tenant/routes.js";

/**
 * Exported interface for monolith consumption.
 *
 * Usage in pynemonk-monolith:
 *   import * as authModule from "pynemonk-core-auth/module";
 *   authModule.init();
 *   app.use("/api/v1", authModule.router);
 */

import { runMigrations } from "./db/MigrationRunner.js";
import pool from "./db/pg-pool.js";

/**
 * Initializes all DI bindings and runs database migrations.
 * Must be called once before the router handles any requests.
 */
export async function init(): Promise<void> {
    setupDI();
    await runMigrations(pool);
}

/**
 * Express Router pre-configured with all auth & oauth2 routes.
 * Mount this under "/api/v1" in the host application.
 *
 * Routes exposed:
 *   POST /auth/register
 *   POST /auth/login
 *   POST /auth/refresh
 *   POST /auth/logout
 *   POST /auth/introspect
 *   POST /oauth2/token
 *   POST /oauth2/client
 *   GET  /oauth2/client
 *   POST /oauth2/scope
 *   GET  /oauth2/scope
 *   POST /oauth2/client-scope
 *
 *   GET  /tenant/packages
 *   POST /tenant/register
 *   GET  /tenant/:id
 */
export const router = Router();
router.use("/oauth2", oauthRouter);
router.use("/auth", authRouter);
router.use("/tenant", tenantRouter);
