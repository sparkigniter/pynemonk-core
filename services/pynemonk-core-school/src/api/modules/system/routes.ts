import * as express from "express";
import { container } from "tsyringe";
import SystemController from "./controllers/SystemController.js";
import { requireAuth } from "../../../api/core/middleware/requireAuth.js";
import { requireRole } from "../../../api/core/middleware/requireRole.js";

const systemRouter = express.Router();

systemRouter.get("/logs", requireAuth, requireRole(["system_admin"]), (req, res) => {
    const ctrl = container.resolve(SystemController);
    return ctrl.getLogs(req, res);
});

systemRouter.post("/logs/clear", requireAuth, requireRole(["system_admin"]), (req, res) => {
    const ctrl = container.resolve(SystemController);
    return ctrl.clearLogs(req, res);
});

systemRouter.get("/metrics", requireAuth, requireRole(["system_admin"]), (req, res) => {
    const ctrl = container.resolve(SystemController);
    return ctrl.getMetrics(req, res);
});

export default systemRouter;
