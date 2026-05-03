import { Router } from "express";
import { container } from "tsyringe";
import IntegrationController from "./controllers/IntegrationController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const router = Router();

router.get("/available", apiRateLimiter, requireAuth, requirePermission(["settings:read"]), (req, res) => {
    const controller = container.resolve(IntegrationController);
    return controller.listAvailable(req, res);
});

router.post("/:systemSlug/toggle", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["settings:write"]), (req, res) => {
    const controller = container.resolve(IntegrationController);
    return controller.toggle(req, res);
});

router.all("/:systemSlug/actions/:action", apiRateLimiter, requireAuth, (req, res) => {
    const controller = container.resolve(IntegrationController);
    return controller.execute(req, res);
});

export default router;
