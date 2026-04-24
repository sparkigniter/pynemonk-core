import { Router } from "express";
import rateLimit from "express-rate-limit";
import { container } from "tsyringe";
import { WorkflowController } from "./controllers/WorkflowController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";

const router = Router();
const onboardRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});
const templatesRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});

router.post("/templates", requireAuth, (req, res) => container.resolve(WorkflowController).createTemplate(req, res));
router.get("/templates", templatesRateLimiter, requireAuth, (req, res) => container.resolve(WorkflowController).listTemplates(req, res));
router.post("/onboard", onboardRateLimiter, requireAuth, (req, res) => container.resolve(WorkflowController).startProcess(req, res));
router.get("/instance/:id", onboardRateLimiter, requireAuth, (req, res) => container.resolve(WorkflowController).getInstance(req, res));

export default router;
