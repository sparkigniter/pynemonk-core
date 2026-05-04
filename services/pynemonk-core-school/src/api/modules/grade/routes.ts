import { Router } from "express";
import { container } from "tsyringe";
import { GradeController } from "./controllers/GradeController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";
import { AuthenticatedRequest } from "../../core/middleware/AuthMiddleware.js";

const router = Router();

router.get("/", apiRateLimiter, requireAuth, requirePermission(["class:read"]), (req, res) => {
    container.resolve(GradeController).list(req as unknown as AuthenticatedRequest, res);
});

router.post("/", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["class:write"]), (req, res) => {
    container.resolve(GradeController).create(req as unknown as AuthenticatedRequest, res);
});

router.put("/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["class:write"]), (req, res) => {
    container.resolve(GradeController).update(req as unknown as AuthenticatedRequest, res);
});

router.delete("/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["class:write"]), (req, res) => {
    container.resolve(GradeController).delete(req as unknown as AuthenticatedRequest, res);
});

export default router;
