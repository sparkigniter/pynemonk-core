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

router.get("/classroom/:classroomId", timetableRateLimiter, requireAuth, (req, res) => {
    container.resolve(TimetableController).getByClassroom(req, res);
});

router.get("/suggestions", timetableRateLimiter, requireAuth, (req, res) => {
    container.resolve(TimetableController).getSuggestions(req, res);
});

router.get("/teacher-schedule", timetableRateLimiter, requireAuth, (req, res) => {
    container.resolve(TimetableController).getTeacherSchedule(req, res);
});

router.post("/", timetableRateLimiter, requireAuth, (req, res) => {
    container.resolve(TimetableController).create(req, res);
});

router.put("/:id", timetableRateLimiter, requireAuth, (req, res) => {
    container.resolve(TimetableController).update(req, res);
});

router.delete("/:id", timetableRateLimiter, requireAuth, (req, res) => {
    container.resolve(TimetableController).delete(req, res);
});

router.get("/periods", timetableRateLimiter, requireAuth, (req, res) => {
    container.resolve(TimetableController).getUniquePeriods(req, res);
});

router.get("/global-schedule", timetableRateLimiter, requireAuth, (req, res) => {
    container.resolve(TimetableController).getGlobalSchedule(req, res);
});

export default router;
