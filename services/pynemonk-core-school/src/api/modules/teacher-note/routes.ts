import { Router } from "express";
import { container } from "tsyringe";
import { TeacherNoteController } from "./controllers/TeacherNoteController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const router = Router();

router.use(requireAuth);

router.get("/", apiRateLimiter, requirePermission(["teacher_note:read"]), (req, res) => container.resolve(TeacherNoteController).listNotes(req, res));
router.post("/", apiRateLimiter, sensitiveRateLimiter, requirePermission(["teacher_note:write"]), (req, res) => container.resolve(TeacherNoteController).createNote(req, res));
router.put("/:id", apiRateLimiter, sensitiveRateLimiter, requirePermission(["teacher_note:write"]), (req, res) => container.resolve(TeacherNoteController).updateNote(req, res));

export default router;
