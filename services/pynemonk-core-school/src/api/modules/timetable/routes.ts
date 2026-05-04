import { Router } from "express";
import { container } from "tsyringe";
import { TimetableController } from "./controllers/TimetableController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const router = Router();

router.get("/classroom/:classroomId", apiRateLimiter, requireAuth, requirePermission(["timetable:read", "self.timetable:read", "child.timetable:read"]), (req, res) => {
    container.resolve(TimetableController).getByClassroom(req, res);
});

router.get("/suggestions", apiRateLimiter, requireAuth, requirePermission(["timetable:read"]), (req, res) => {
    container.resolve(TimetableController).getSuggestions(req, res);
});

router.get("/teacher-schedule", apiRateLimiter, requireAuth, requirePermission(["timetable:read"]), (req, res) => {
    container.resolve(TimetableController).getTeacherSchedule(req, res);
});

router.post("/", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["timetable:write"]), (req, res) => {
    container.resolve(TimetableController).create(req, res);
});

router.put("/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["timetable:write"]), (req, res) => {
    container.resolve(TimetableController).update(req, res);
});

router.delete("/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["timetable:write"]), (req, res) => {
    container.resolve(TimetableController).delete(req, res);
});

router.get("/periods", apiRateLimiter, requireAuth, requirePermission(["timetable:read"]), (req, res) => {
    container.resolve(TimetableController).getUniquePeriods(req, res);
});

router.get("/global-schedule", apiRateLimiter, requireAuth, requirePermission(["timetable:read"]), (req, res) => {
    container.resolve(TimetableController).getGlobalSchedule(req, res);
});

router.post("/classroom/:classroomId/auto-generate", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["timetable:write"]), (req, res) => {
    container.resolve(TimetableController).autoGenerate(req, res);
});

router.post("/classroom/:classroomId/finalize", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["timetable:write"]), (req, res) => {
    container.resolve(TimetableController).finalize(req, res);
});

router.patch("/:id/sticky", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["timetable:write"]), (req, res) => {
    container.resolve(TimetableController).toggleSticky(req, res);
});

router.get("/breaks", apiRateLimiter, requireAuth, requirePermission(["timetable:read"]), (req, res) => {
    container.resolve(TimetableController).getBreaks(req, res);
});

router.post("/breaks", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["timetable:write"]), (req, res) => {
    container.resolve(TimetableController).createBreak(req, res);
});

router.delete("/breaks/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["timetable:write"]), (req, res) => {
    container.resolve(TimetableController).deleteBreak(req, res);
});

export default router;
