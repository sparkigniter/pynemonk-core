import { Router } from "express";
import { container } from "tsyringe";
import RolloverController from "./controllers/RolloverController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requireRole } from "../../core/middleware/requireRole.js";

const academicsRouter = Router();

academicsRouter.get("/years", requireAuth, (req, res) =>
    container.resolve(RolloverController).getYears(req, res),
);

academicsRouter.post("/years", requireAuth, requireRole(["owner"]), (req, res) =>
    container.resolve(RolloverController).createYear(req, res),
);

academicsRouter.get("/rollover/preview", requireAuth, requireRole(["owner", "principal"]), (req, res) =>
    container.resolve(RolloverController).preview(req, res),
);

academicsRouter.post("/rollover/execute", requireAuth, requireRole(["owner"]), (req, res) =>
    container.resolve(RolloverController).execute(req, res),
);

export default academicsRouter;
