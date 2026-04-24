import { Router } from "express";
import { container } from "tsyringe";
import { TimetableController } from "./controllers/TimetableController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";

const router = Router();

router.get("/classroom/:classroomId", requireAuth, (req, res) => {
    container.resolve(TimetableController).getByClassroom(req, res);
});

router.get("/suggestions", requireAuth, (req, res) => {
    container.resolve(TimetableController).getSuggestions(req, res);
});

router.get("/teacher-schedule", requireAuth, (req, res) => {
    container.resolve(TimetableController).getTeacherSchedule(req, res);
});

router.post("/", requireAuth, (req, res) => {
    container.resolve(TimetableController).create(req, res);
});

router.put("/:id", requireAuth, (req, res) => {
    container.resolve(TimetableController).update(req, res);
});

router.delete("/:id", requireAuth, (req, res) => {
    container.resolve(TimetableController).delete(req, res);
});

router.get("/periods", requireAuth, (req, res) => {
    container.resolve(TimetableController).getUniquePeriods(req, res);
});

router.get("/global-schedule", requireAuth, (req, res) => {
    container.resolve(TimetableController).getGlobalSchedule(req, res);
});

export default router;
