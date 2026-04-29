import { Router } from "express";
import { container } from "tsyringe";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import AttendanceController from "./controllers/AttendanceController.js";

const router = Router();

router.get("/roster/:classroomId", requireAuth, (req, res) => {
    const controller = container.resolve(AttendanceController);
    return controller.getRoster(req, res);
});

router.post("/save", requireAuth, (req, res) => {
    const controller = container.resolve(AttendanceController);
    return controller.saveAttendance(req, res);
});

export default router;
