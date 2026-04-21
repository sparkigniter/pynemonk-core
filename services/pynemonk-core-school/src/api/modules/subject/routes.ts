import { Router } from "express";
import { container } from "tsyringe";
import SubjectController from "./controllers/SubjectController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requireRole } from "../../core/middleware/requireRole.js";
import { AuthenticatedRequest } from "../../core/middleware/AuthMiddleware.js";

const subjectRouter = Router();

subjectRouter.get("/", requireAuth, (req, res) =>
    container.resolve(SubjectController).list(req as AuthenticatedRequest, res),
);
subjectRouter.get("/assignments", requireAuth, (req, res) =>
    container.resolve(SubjectController).listAssignments(req as AuthenticatedRequest, res),
);
subjectRouter.get("/:id", requireAuth, (req, res) =>
    container.resolve(SubjectController).get(req as AuthenticatedRequest, res),
);
subjectRouter.post(
    "/",
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(SubjectController).create(req as AuthenticatedRequest, res),
);
subjectRouter.post(
    "/assign-teacher",
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(SubjectController).assignTeacher(req as AuthenticatedRequest, res),
);
subjectRouter.put(
    "/:id",
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(SubjectController).update(req as AuthenticatedRequest, res),
);
subjectRouter.delete("/:id", requireAuth, requireRole(["owner", "principal"]), (req, res) =>
    container.resolve(SubjectController).delete(req as AuthenticatedRequest, res),
);

export default subjectRouter;
