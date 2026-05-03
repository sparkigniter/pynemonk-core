import { Router } from "express";
import { container } from "tsyringe";
import { WorkflowController } from "./controllers/WorkflowController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const router = Router();

// Template Management
router.post("/templates", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["settings:write"]), (req, res) => container.resolve(WorkflowController).createTemplate(req, res));
router.get("/templates", apiRateLimiter, requireAuth, requirePermission(["settings:read"]), (req, res) => container.resolve(WorkflowController).listTemplates(req, res));

// Process & Instance Management
router.get("/pipeline", apiRateLimiter, requireAuth, requirePermission(["settings:read"]), (req, res) => container.resolve(WorkflowController).getPipeline(req, res));
router.post("/onboard", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["settings:write"]), (req, res) => container.resolve(WorkflowController).startProcess(req, res));
router.get("/instance/:id", apiRateLimiter, requireAuth, requirePermission(["settings:read"]), (req, res) => container.resolve(WorkflowController).getInstance(req, res));
router.post("/update-step", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["settings:write"]), (req, res) => container.resolve(WorkflowController).updateStep(req, res));

export default router;
