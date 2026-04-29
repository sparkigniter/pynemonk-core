import { Router } from "express";
import { container } from "tsyringe";
import { TeacherNoteController } from "./controllers/TeacherNoteController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/", (req, res) => container.resolve(TeacherNoteController).listNotes(req, res));
router.post("/", (req, res) => container.resolve(TeacherNoteController).createNote(req, res));
router.put("/:id", (req, res) => container.resolve(TeacherNoteController).updateNote(req, res));

export default router;
