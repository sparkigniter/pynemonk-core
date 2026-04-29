import { Router } from "express";
import rateLimit from "express-rate-limit";
import { container } from "tsyringe";
import { WorkflowController } from "./controllers/WorkflowController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";

const router = Router();

const workflowRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});

const onboardRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});

const templatesRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});

// Template Management
router.post("/templates", templatesRateLimiter, requireAuth, (req, res) => container.resolve(WorkflowController).createTemplate(req, res));
router.get("/templates", templatesRateLimiter, requireAuth, (req, res) => container.resolve(WorkflowController).listTemplates(req, res));

// Process & Instance Management
router.get("/pipeline", onboardRateLimiter, requireAuth, (req, res) => container.resolve(WorkflowController).getPipeline(req, res));
router.post("/onboard", onboardRateLimiter, requireAuth, (req, res) => container.resolve(WorkflowController).startProcess(req, res));
router.get("/instance/:id", onboardRateLimiter, requireAuth, (req, res) => container.resolve(WorkflowController).getInstance(req, res));
router.post("/update-step", workflowRateLimiter, requireAuth, (req, res) => container.resolve(WorkflowController).updateStep(req, res));

export default router;
