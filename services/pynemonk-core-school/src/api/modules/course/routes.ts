import { Router } from "express";
import { container } from "tsyringe";
import CourseController from "./controllers/CourseController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

import { AuthenticatedRequest } from "../../core/middleware/AuthMiddleware.js";

const courseRouter = Router();

courseRouter.get("/", apiRateLimiter, requireAuth, requirePermission(["class:read"]), (req, res) =>
    container.resolve(CourseController).list(req as AuthenticatedRequest, res),
);
courseRouter.get("/:id", apiRateLimiter, requireAuth, requirePermission(["class:read"]), (req, res) =>
    container.resolve(CourseController).get(req as AuthenticatedRequest, res),
);
courseRouter.post(
    "/",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["class:write"]),
    (req, res) => container.resolve(CourseController).create(req as AuthenticatedRequest, res),
);
courseRouter.put(
    "/:id",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["class:write"]),
    (req, res) => container.resolve(CourseController).update(req as AuthenticatedRequest, res),
);
courseRouter.delete("/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["class:write"]), (req, res) =>
    container.resolve(CourseController).delete(req as AuthenticatedRequest, res),
);

export default courseRouter;
