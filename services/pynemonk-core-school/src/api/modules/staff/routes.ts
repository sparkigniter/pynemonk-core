import { Router } from "express";
import { container } from "tsyringe";
import StaffController from "./controllers/StaffController.js";
import RoleController from "./controllers/RoleController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requireRole } from "../../core/middleware/requireRole.js";
import { AuthMiddleware, AuthenticatedRequest } from "../../core/middleware/AuthMiddleware.js";

const staffRouter = Router();

// ── Staff Profiles ────────────────────────────────────────────────────────
staffRouter.get("/", requireAuth, (req, res) => container.resolve(StaffController).list(req, res));
staffRouter.get("/:id", requireAuth, (req, res) =>
    container.resolve(StaffController).get(req, res),
);
staffRouter.get("/profile/me", requireAuth, (req, res) =>
    container.resolve(StaffController).getMe(req, res),
);
staffRouter.post(
    "/",
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(StaffController).create(req, res),
);
staffRouter.put(
    "/:id",
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(StaffController).update(req, res),
);
staffRouter.delete("/:id", requireAuth, requireRole(["owner", "principal"]), (req, res) =>
    container.resolve(StaffController).delete(req, res),
);

// ── Role Management ───────────────────────────────────────────────────────
staffRouter.get(
    "/roles/available",
    (req, res, next) => container.resolve(AuthMiddleware).handle(req, res, next),
    (req, res) =>
        container.resolve(RoleController).listAvailableRoles(req as AuthenticatedRequest, res),
);

staffRouter.get(
    "/roles/me",
    (req, res, next) => container.resolve(AuthMiddleware).handle(req, res, next),
    (req, res) => container.resolve(RoleController).getMyRoles(req as AuthenticatedRequest, res),
);

staffRouter.post(
    "/roles/assign",
    (req, res, next) => container.resolve(AuthMiddleware).handle(req, res, next),
    (req, res, next) =>
        container.resolve(AuthMiddleware).authorize(["owner", "school_admin"])(req, res, next),
    (req, res) => container.resolve(RoleController).assignRole(req as AuthenticatedRequest, res),
);

staffRouter.delete(
    "/roles/remove",
    (req, res, next) => container.resolve(AuthMiddleware).handle(req, res, next),
    (req, res, next) =>
        container.resolve(AuthMiddleware).authorize(["owner", "school_admin"])(req, res, next),
    (req, res) => container.resolve(RoleController).removeRole(req as AuthenticatedRequest, res),
);

export default staffRouter;
