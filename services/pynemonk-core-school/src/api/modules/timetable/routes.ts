import { Router } from "express";
import rateLimit from "express-rate-limit";
import { container } from "tsyringe";
import { TimetableController } from "./controllers/TimetableController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";

const router = Router();

const timetableRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

router.get("/classroom/:classroomId", requireAuth, timetableRateLimiter, (req, res) => {
    container.resolve(TimetableController).getByClassroom(req, res);
});

router.get("/suggestions", requireAuth, timetableRateLimiter, (req, res) => {
    container.resolve(TimetableController).getSuggestions(req, res);
});

router.get("/teacher-schedule", requireAuth, timetableRateLimiter, (req, res) => {
    container.resolve(TimetableController).getTeacherSchedule(req, res);
});

router.post("/", requireAuth, timetableRateLimiter, (req, res) => {
    container.resolve(TimetableController).create(req, res);
});

router.put("/:id", requireAuth, timetableRateLimiter, (req, res) => {
    container.resolve(TimetableController).update(req, res);
});

router.delete("/:id", requireAuth, timetableRateLimiter, (req, res) => {
    container.resolve(TimetableController).delete(req, res);
});

router.get("/periods", requireAuth, timetableRateLimiter, (req, res) => {
    container.resolve(TimetableController).getUniquePeriods(req, res);
});

router.get("/global-schedule", requireAuth, timetableRateLimiter, (req, res) => {
    container.resolve(TimetableController).getGlobalSchedule(req, res);
});

export default router;
