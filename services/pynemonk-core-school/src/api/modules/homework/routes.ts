import { Router } from "express";
import { container } from "tsyringe";
import { HomeworkController } from "./controllers/HomeworkController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const homeworkRouter = Router();

homeworkRouter.get("/", apiRateLimiter, requireAuth, requirePermission(["assignment:read"]), (req, res) =>
    container.resolve(HomeworkController).list(req, res),
);

homeworkRouter.post("/", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["assignment:write"]), (req, res) =>
    container.resolve(HomeworkController).create(req, res),
);

homeworkRouter.put("/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["assignment:write"]), (req, res) =>
    container.resolve(HomeworkController).update(req, res),
);

homeworkRouter.delete("/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["assignment:write"]), (req, res) =>
    container.resolve(HomeworkController).delete(req, res),
);

homeworkRouter.get("/:id", apiRateLimiter, requireAuth, requirePermission(["assignment:read"]), (req, res) =>
    container.resolve(HomeworkController).getById(req, res),
);

export default homeworkRouter;
