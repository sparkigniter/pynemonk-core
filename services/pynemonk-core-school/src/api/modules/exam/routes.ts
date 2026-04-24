import { Router } from "express";
import { container } from "tsyringe";
import { ExamController } from "./controllers/ExamController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

// Terms
router.get("/terms", (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.listTerms(req, res);
});

router.post("/terms", (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.createTerm(req, res);
});

// Exams
router.get("/", (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.listExams(req, res);
});

router.post("/", (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.createExam(req, res);
});

router.get("/:id", (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.getExam(req, res);
});

// Exam Details
router.post("/:id/papers", (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.addPaper(req, res);
});

router.post("/:id/invitations", (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.addInvitation(req, res);
});

router.put("/:id/students/:studentId", (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.updateStudentStatus(req, res);
});

router.get("/:id/papers/:paperId/students", (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.getPaperStudents(req, res);
});

router.post("/:id/papers/:paperId/marks", (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.saveMarks(req, res);
});

router.patch("/:id/status", (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.updateStatus(req, res);
});

export default router;
