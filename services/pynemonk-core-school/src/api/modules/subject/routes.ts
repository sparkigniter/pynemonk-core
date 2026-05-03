import { Router } from "express";
import { container } from "tsyringe";
import SubjectController from "./controllers/SubjectController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";
import { AuthenticatedRequest } from "../../core/middleware/AuthMiddleware.js";

const subjectRouter = Router();

subjectRouter.get("/", apiRateLimiter, requireAuth, requirePermission(["class:read"]), (req, res) =>
    container.resolve(SubjectController).list(req as AuthenticatedRequest, res),
);
subjectRouter.get("/assignments", apiRateLimiter, requireAuth, requirePermission(["staff.academic:read"]), (req, res) =>
    container.resolve(SubjectController).listAssignments(req as AuthenticatedRequest, res),
);
subjectRouter.get("/:id", apiRateLimiter, requireAuth, requirePermission(["class:read"]), (req, res) =>
    container.resolve(SubjectController).get(req as AuthenticatedRequest, res),
);
subjectRouter.post(
    "/",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["class:write"]),
    (req, res) => container.resolve(SubjectController).create(req as AuthenticatedRequest, res),
);
subjectRouter.post(
    "/assign-teacher",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["class:write"]),
    (req, res) => container.resolve(SubjectController).assignTeacher(req as AuthenticatedRequest, res),
);
subjectRouter.post(
    "/bulk-assign-teacher",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["class:write"]),
    (req, res) => container.resolve(SubjectController).bulkAssignTeachers(req as AuthenticatedRequest, res),
);
subjectRouter.put(
    "/:id",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["class:write"]),
    (req, res) => container.resolve(SubjectController).update(req as AuthenticatedRequest, res),
);
subjectRouter.delete("/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["class:write"]), (req, res) =>
    container.resolve(SubjectController).delete(req as AuthenticatedRequest, res),
);

export default subjectRouter;
