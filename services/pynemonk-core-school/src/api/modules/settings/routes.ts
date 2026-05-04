import { Router } from "express";
import { container } from "tsyringe";
import SettingsController from "./controllers/SettingsController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const router = Router();

router.get("/", apiRateLimiter, requireAuth, requirePermission(["settings:read"]), (req, res) => {
    return container.resolve(SettingsController).getSettings(req, res);
});

router.put("/", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["settings:write"]), (req, res) => {
    return container.resolve(SettingsController).updateSettings(req, res);
});

export default router;
