import { Router } from "express";
import { container } from "tsyringe";
import { WorkflowController } from "./controllers/WorkflowController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";

const router = Router();
router.post("/templates", requireAuth, (req, res) => container.resolve(WorkflowController).createTemplate(req, res));
router.get("/templates", requireAuth, (req, res) => container.resolve(WorkflowController).listTemplates(req, res));
router.post("/onboard", requireAuth, (req, res) => container.resolve(WorkflowController).startProcess(req, res));
router.get("/instance/:id", requireAuth, (req, res) => container.resolve(WorkflowController).getInstance(req, res));

export default router;
