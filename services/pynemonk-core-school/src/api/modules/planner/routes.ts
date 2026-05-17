import { Router } from "express";
import { container } from "tsyringe";
import { AcademicPlannerController } from "./controllers/AcademicPlannerController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const plannerRouter = Router();

plannerRouter.get("/", apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).listPlanners(req, res)
);

plannerRouter.get("/by-teacher-subject", apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).getPlannerByTeacherAndSubject(req, res)
);

plannerRouter.post("/", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).createPlanner(req, res)
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

plannerRouter.post("/:id/milestones", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).addMilestone(req, res)
);

plannerRouter.post("/:id/auto-schedule", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) =>
    container.resolve(AcademicPlannerController).autoSchedulePlanner(req, res)
);

export default plannerRouter;
