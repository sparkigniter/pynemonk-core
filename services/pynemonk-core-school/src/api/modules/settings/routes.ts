import { Router } from "express";
import { container } from "tsyringe";
import SettingsController from "./controllers/SettingsController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requireRole } from "../../core/middleware/requireRole.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
    return container.resolve(SettingsController).getSettings(req, res);
});

router.put("/", requireAuth, requireRole(["owner", "principal", "school_admin"]), (req, res) => {
    return container.resolve(SettingsController).updateSettings(req, res);
});

export default router;
