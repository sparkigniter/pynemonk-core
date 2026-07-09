import { Router } from "express";
import { container } from "tsyringe";
import { ExamController } from "./controllers/ExamController.js";
import { ReportCardController } from "./controllers/ReportCardController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const router = Router();

router.use(requireAuth);

// Terms
router.get("/terms", apiRateLimiter, requirePermission(["exam:read", "student.academic:read", "self.academic:read", "child.academic:read"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.listTerms(req, res);
});

router.post("/terms", apiRateLimiter, sensitiveRateLimiter, requirePermission(["exam:write", "student.academic:write"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.createTerm(req, res);
});

// Stats
router.get("/stats", apiRateLimiter, requirePermission(["exam:read", "student.academic:read"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.getStats(req, res);
});

// Exams
router.get("/", apiRateLimiter, requirePermission(["exam:read", "student.academic:read", "self.academic:read", "child.academic:read"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.listExams(req, res);
});

router.post("/", apiRateLimiter, sensitiveRateLimiter, requirePermission(["exam:write", "student.academic:write"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.createExam(req, res);
});

// Report Card Template & Settings Routes (Concrete routes must be placed above dynamic /:id)
router.get("/report-settings", apiRateLimiter, requirePermission(["exam:read"]), (req, res) => {
    const controller = container.resolve(ReportCardController);
    return controller.getReportSettings(req, res);
});

router.post("/report-settings", apiRateLimiter, sensitiveRateLimiter, requirePermission(["exam:write"]), (req, res) => {
    const controller = container.resolve(ReportCardController);
    return controller.saveReportSettings(req, res);
});

router.get("/:id", apiRateLimiter, requirePermission(["exam:read", "student.academic:read", "self.academic:read", "child.academic:read"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.getExam(req, res);
});

router.get("/:id/results", apiRateLimiter, requirePermission(["exam:read", "student.academic:read", "self.academic:read", "child.academic:read"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.getExamResults(req, res);
});

router.put("/:id", apiRateLimiter, sensitiveRateLimiter, requirePermission(["exam:write", "student.academic:write"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.updateExam(req, res);
});

// Exam Details
router.post("/:id/papers", apiRateLimiter, sensitiveRateLimiter, requirePermission(["exam:write", "student.academic:write"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.addPaper(req, res);
});

router.patch("/:id/papers/:paperId/delete", apiRateLimiter, sensitiveRateLimiter, requirePermission(["exam:write", "student.academic:write"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.deletePaper(req, res);
});

router.post("/:id/invitations", apiRateLimiter, sensitiveRateLimiter, requirePermission(["exam:write", "student.academic:write"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.addInvitation(req, res);
});

router.put("/:id/students/:studentId", apiRateLimiter, sensitiveRateLimiter, requirePermission(["exam:write", "student.academic:write"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.updateStudentStatus(req, res);
});

router.get("/:id/students", apiRateLimiter, requirePermission(["exam:read", "student.academic:read"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.listInvitedStudents(req, res);
});

router.get("/:id/papers/:paperId/students", apiRateLimiter, requirePermission(["exam:read", "student.academic:read"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.getPaperStudents(req, res);
});

router.post("/:id/papers/:paperId/marks", apiRateLimiter, sensitiveRateLimiter, requirePermission(["exam:write", "student.academic:write"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.saveMarks(req, res);
});

router.get("/:id/papers/:paperId/questions", apiRateLimiter, requirePermission(["exam:read", "student.academic:read"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.getPaperQuestions(req, res);
});

router.post("/:id/papers/:paperId/questions", apiRateLimiter, sensitiveRateLimiter, requirePermission(["exam:write", "student.academic:write"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.savePaperQuestions(req, res);
});

router.post("/:id/papers/:paperId/generate", apiRateLimiter, sensitiveRateLimiter, requirePermission(["exam:write", "student.academic:write"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.generateQuestionPaper(req, res);
});

router.patch("/:id/status", apiRateLimiter, sensitiveRateLimiter, requirePermission(["exam:write", "student.academic:write"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.updateStatus(req, res);
});

router.get("/performance/:studentId", apiRateLimiter, requirePermission(["exam:read", "student.academic:read", "self.academic:read", "child.academic:read"]), (req, res) => {
    const controller = container.resolve(ExamController);
    return controller.getStudentPerformance(req, res);
});

// Report Card Routes
router.get("/:examId/students/:studentId/report", apiRateLimiter, requirePermission(["exam:read", "student.academic:read", "self.academic:read", "child.academic:read"]), (req, res) => {
    const controller = container.resolve(ReportCardController);
    return controller.getStudentReport(req, res);
});

router.get("/:examId/students/:studentId/report/pdf", apiRateLimiter, requirePermission(["exam:read", "student.academic:read", "self.academic:read", "child.academic:read"]), (req, res) => {
    const controller = container.resolve(ReportCardController);
    return controller.downloadStudentReportPDF(req, res);
});

router.get("/:examId/classrooms/:classroomId/reports", apiRateLimiter, requirePermission(["exam:read", "student.academic:read"]), (req, res) => {
    const controller = container.resolve(ReportCardController);
    return controller.getClassroomReports(req, res);
});

export default router;
