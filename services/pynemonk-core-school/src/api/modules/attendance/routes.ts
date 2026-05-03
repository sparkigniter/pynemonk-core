import { Router } from "express";
import { container } from "tsyringe";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";
import AttendanceController from "./controllers/AttendanceController.js";

const router = Router();

router.get("/roster/:classroomId", apiRateLimiter, requireAuth, requirePermission(["student.attendance:read"]), (req, res) => {
    const controller = container.resolve(AttendanceController);
    return controller.getRoster(req, res);
});

router.post("/", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["student.attendance:write"]), (req, res) => {
    const controller = container.resolve(AttendanceController);
    return controller.saveAttendance(req, res);
});

router.post("/save", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["student.attendance:write"]), (req, res) => {
    const controller = container.resolve(AttendanceController);
    return controller.saveAttendance(req, res);
});

export default router;
