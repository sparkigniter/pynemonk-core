import "reflect-metadata";
import * as express from "express";
import { container } from "tsyringe";
import TenantController from "./controllers/TenantController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";

const tenantRouter = express.Router();

/**
 * GET /api/v1/tenant
 * List all tenants (System Admin only).
 */
tenantRouter.get("/", requireAuth, (req, res) => {
    const ctrl = container.resolve(TenantController);
    return ctrl.listTenants(req, res);
});

/**
 * GET /api/v1/tenant/packages
 * List all available subscription packages (public — no auth required).
 */
tenantRouter.get("/packages", (req, res) => {
    const ctrl = container.resolve(TenantController);
    return ctrl.listPackages(req, res);
});

/**
 * POST /api/v1/tenant/register
 * Register a new school (public — called before login exists).
 * Body: { name, email, phone?, address?, city?, state?, country?, package_id }
 */
tenantRouter.post("/register", (req, res) => {
    const ctrl = container.resolve(TenantController);
    return ctrl.register(req, res);
});

/**
 * POST /api/v1/tenant/:id/setup-owner
 * Step 2 — create the owner account after school is registered.
 * One-time only. Body: { admin_email, admin_password }
 */
tenantRouter.post("/:id/setup-owner", (req, res) => {
    const ctrl = container.resolve(TenantController);
    return ctrl.setupOwner(req, res);
});

/**
 * GET /api/v1/tenant/:id
 * Get a tenant by id.
 */
tenantRouter.get("/:id", (req, res) => {
    const ctrl = container.resolve(TenantController);
    return ctrl.getTenant(req, res);
});

export default tenantRouter;
