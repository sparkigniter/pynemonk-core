import { Router } from "express";
import { container } from "tsyringe";
import { HomeworkController } from "./controllers/HomeworkController.js";
import { LMSController } from "./controllers/LMSController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const homeworkRouter = Router();

homeworkRouter.get("/", apiRateLimiter, requireAuth, requirePermission(["assignment:read"]), (req, res) =>
    container.resolve(HomeworkController).list(req, res),
);

homeworkRouter.post("/", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["assignment:write"]), (req, res) =>
    container.resolve(HomeworkController).create(req, res),
);

homeworkRouter.put("/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["assignment:write"]), (req, res) =>
    container.resolve(HomeworkController).update(req, res),
);

homeworkRouter.delete("/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["assignment:write"]), (req, res) =>
    container.resolve(HomeworkController).delete(req, res),
);

homeworkRouter.get("/:id", apiRateLimiter, requireAuth, requirePermission(["assignment:read"]), (req, res) =>
    container.resolve(HomeworkController).getById(req, res),
);

// --- LMS Lite Routes ---
homeworkRouter.get("/lms/library", apiRateLimiter, requireAuth, (req, res) => {
    return container.resolve(LMSController).getResources(req, res);
});

homeworkRouter.post("/lms/library", apiRateLimiter, requireAuth, requirePermission(["assignment:write"]), (req, res) => {
    return container.resolve(LMSController).createResource(req, res);
});

homeworkRouter.post("/lms/submit", apiRateLimiter, sensitiveRateLimiter, requireAuth, (req, res) => {
    return container.resolve(LMSController).submitAssignment(req, res);
});

homeworkRouter.get("/lms/:homeworkId/submissions", apiRateLimiter, requireAuth, requirePermission(["assignment:write"]), (req, res) => {
    return container.resolve(LMSController).getSubmissionsForHomework(req, res);
});

homeworkRouter.post("/lms/submissions/:id/grade", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["assignment:write"]), (req, res) => {
    return container.resolve(LMSController).gradeSubmission(req, res);
});

export default homeworkRouter;
