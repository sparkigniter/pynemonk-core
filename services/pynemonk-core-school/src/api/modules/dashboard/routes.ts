import { Router } from "express";
import { container } from "tsyringe";
import DashboardController from "./controllers/DashboardController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
    const controller = container.resolve(DashboardController);
    return controller.getDashboard(req, res);
});

export default router;
