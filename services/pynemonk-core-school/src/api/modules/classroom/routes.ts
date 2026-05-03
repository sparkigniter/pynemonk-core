import { Router } from "express";
import { container } from "tsyringe";
import ClassroomController from "./controllers/ClassroomController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const classroomRouter = Router();

classroomRouter.get("/", apiRateLimiter, requireAuth, requirePermission(["class:read"]), (req, res) =>
    container.resolve(ClassroomController).list(req, res),
);
classroomRouter.get("/:id", apiRateLimiter, requireAuth, requirePermission(["class:read"]), (req, res) =>
    container.resolve(ClassroomController).get(req, res),
);
classroomRouter.post(
    "/",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["class:write"]),
    (req, res) => container.resolve(ClassroomController).create(req, res),
);
classroomRouter.put(
    "/:id",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["class:write"]),
    (req, res) => container.resolve(ClassroomController).update(req, res),
);
classroomRouter.delete("/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["class:write"]), (req, res) =>
    container.resolve(ClassroomController).delete(req, res),
);

export default classroomRouter;
