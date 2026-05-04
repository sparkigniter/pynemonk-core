import { Router } from "express";
import { container } from "tsyringe";
import DashboardController from "./controllers/DashboardController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter } from "../../core/middleware/RateLimiter.js";

const router = Router();

router.get("/", apiRateLimiter, requireAuth, requirePermission(["report:read"]), (req, res) => {
    const controller = container.resolve(DashboardController);
    return controller.getDashboard(req, res);
});

export default router;
