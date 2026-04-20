import { Router } from "express";
import { container } from "tsyringe";
import CourseController from "./controllers/CourseController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requireRole } from "../../core/middleware/requireRole.js";

import { AuthenticatedRequest } from "../../core/middleware/AuthMiddleware.js";

const courseRouter = Router();

courseRouter.get("/", requireAuth, (req, res) =>
    container.resolve(CourseController).list(req as AuthenticatedRequest, res),
);
courseRouter.get("/:id", requireAuth, (req, res) =>
    container.resolve(CourseController).get(req as AuthenticatedRequest, res),
);
courseRouter.post(
    "/",
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(CourseController).create(req as AuthenticatedRequest, res),
);
courseRouter.put(
    "/:id",
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(CourseController).update(req as AuthenticatedRequest, res),
);
courseRouter.delete("/:id", requireAuth, requireRole(["owner", "principal"]), (req, res) =>
    container.resolve(CourseController).delete(req as AuthenticatedRequest, res),
);

export default courseRouter;
