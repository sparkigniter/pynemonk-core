import { Router } from "express";
import { container } from "tsyringe";
import RolloverController from "./controllers/RolloverController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const academicsRouter = Router();

academicsRouter.get("/years", apiRateLimiter, requireAuth, requirePermission(["settings:read"]), (req, res) =>
    container.resolve(RolloverController).getYears(req, res),
);

academicsRouter.post("/years", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["settings:write"]), (req, res) =>
    container.resolve(RolloverController).createYear(req, res),
);

academicsRouter.get("/rollover/preview", apiRateLimiter, requireAuth, requirePermission(["report:read"]), (req, res) =>
    container.resolve(RolloverController).preview(req, res),
);

academicsRouter.post("/rollover/execute", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["settings:write"]), (req, res) =>
    container.resolve(RolloverController).execute(req, res),
);

export default academicsRouter;
