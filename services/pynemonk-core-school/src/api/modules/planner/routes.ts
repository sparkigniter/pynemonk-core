import { Router } from "express";
import { container } from "tsyringe";
import { AcademicPlannerController } from "./controllers/AcademicPlannerController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

import { SmartPlannerController } from "./controllers/SmartPlannerController.js";
import { GlobalContentUploadController } from "./controllers/GlobalContentUploadController.js";
import { LessonPlanController } from "./controllers/LessonPlanController.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const plannerRouter = Router();

plannerRouter.post("/global/syllabus", upload.single('file'), apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(GlobalContentUploadController).uploadSyllabus(req, res)
);

plannerRouter.post("/global/questions", upload.single('file'), apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(GlobalContentUploadController).uploadQuestionBank(req, res)
);

plannerRouter.get("/smart/templates", apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(SmartPlannerController).getTemplates(req, res)
);

plannerRouter.get("/smart/templates/:id", apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(SmartPlannerController).getTemplateDetails(req, res)
);

plannerRouter.get("/smart/taxonomy", apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(SmartPlannerController).getTaxonomy(req, res)
);

plannerRouter.post("/smart/subscribe", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(SmartPlannerController).subscribe(req, res)
);

plannerRouter.get("/smart", apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(SmartPlannerController).getPlanByClassroomAndSubject(req, res)
);

plannerRouter.get("/smart/:id", apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(SmartPlannerController).getPlanDetails(req, res)
);

plannerRouter.put("/smart/sessions/:id", apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(SmartPlannerController).updatePlannedSession(req, res)
);

plannerRouter.get("/", apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).listPlanners(req, res)
);

plannerRouter.get("/by-teacher-subject", apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).getPlannerByTeacherAndSubject(req, res)
);

plannerRouter.post("/", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).createPlanner(req, res)
);

plannerRouter.get("/lessons", apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(LessonPlanController).getLessonPlans(req, res)
);

plannerRouter.post("/lessons", apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(LessonPlanController).saveLessonPlan(req, res)
);

plannerRouter.get("/:id", apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).getPlannerDetails(req, res)
);

plannerRouter.post("/:id/chapters", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).addChapter(req, res)
);

plannerRouter.put("/chapters/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).updateChapter(req, res)
);

plannerRouter.delete("/chapters/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).deleteChapter(req, res)
);

plannerRouter.post("/chapters/:id/move", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).moveChapter(req, res)
);

plannerRouter.post("/:id/milestones", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).addMilestone(req, res)
);

plannerRouter.post("/:id/auto-schedule", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).autoSchedulePlanner(req, res)
);

plannerRouter.post("/:id/import-global-syllabus", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).importGlobalSyllabus(req, res)
);

// Manual Planner Topics
plannerRouter.post("/chapters/:chapterId/topics", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).addTopic(req, res)
);

plannerRouter.put("/topics/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).updateTopic(req, res)
);

plannerRouter.delete("/topics/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).deleteTopic(req, res)
);

plannerRouter.post("/topics/:id/move", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).moveTopic(req, res)
);

export default plannerRouter;
