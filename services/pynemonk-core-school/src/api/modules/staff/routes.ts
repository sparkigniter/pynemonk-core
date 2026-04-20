import { Router } from "express";
import { container } from "tsyringe";
import StaffController from "./controllers/StaffController.js";
import RoleController from "./controllers/RoleController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requireRole } from "../../core/middleware/requireRole.js";
import { AuthMiddleware } from "../../core/middleware/AuthMiddleware.js";

const staffRouter = Router();

// ── Staff Profiles ────────────────────────────────────────────────────────
staffRouter.get("/", requireAuth, (req, res) => container.resolve(StaffController).list(req, res));
staffRouter.get("/:id", requireAuth, (req, res) => container.resolve(StaffController).get(req, res));
staffRouter.post("/", requireAuth, requireRole(["owner", "principal", "school_admin"]), (req, res) => container.resolve(StaffController).create(req, res));
staffRouter.put("/:id", requireAuth, requireRole(["owner", "principal", "school_admin"]), (req, res) => container.resolve(StaffController).update(req, res));
staffRouter.delete("/:id", requireAuth, requireRole(["owner", "principal"]), (req, res) => container.resolve(StaffController).delete(req, res));

// ── Role Management ───────────────────────────────────────────────────────
const roleCtrl = (req: any) => container.resolve(RoleController);
const auth = (req: any) => container.resolve(AuthMiddleware);

staffRouter.get("/roles/available", 
    (req, res, next) => auth(req).handle(req, res, next), 
    (req, res) => roleCtrl(req).listAvailableRoles(req, res)
);

staffRouter.get("/roles/me", 
    (req, res, next) => auth(req).handle(req, res, next), 
    (req, res) => roleCtrl(req).getMyRoles(req, res)
);

staffRouter.post("/roles/assign", 
    (req, res, next) => auth(req).handle(req, res, next), 
    (req, res, next) => auth(req).authorize(["owner", "school_admin"])(req, res, next),
    (req, res) => roleCtrl(req).assignRole(req, res)
);

staffRouter.delete("/roles/remove", 
    (req, res, next) => auth(req).handle(req, res, next), 
    (req, res, next) => auth(req).authorize(["owner", "school_admin"])(req, res, next),
    (req, res) => roleCtrl(req).removeRole(req, res)
);

export default staffRouter;
