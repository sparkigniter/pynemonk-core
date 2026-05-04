import { Router } from "express";
import { container } from "tsyringe";
import GuardianController from "./controllers/GuardianController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const guardianRouter = Router();

// Parent specific routes
guardianRouter.get(
    "/my-students", 
    apiRateLimiter,
    requireAuth, 
    requirePermission(["child.academic:read"]), 
    (req, res) => container.resolve(GuardianController).getMyStudents(req, res)
);

guardianRouter.get(
    "/student/:studentId/attendance",
    apiRateLimiter,
    requireAuth,
    requirePermission(["child.attendance:read"]),
    (req, res) => container.resolve(GuardianController).getStudentAttendance(req, res)
);

guardianRouter.get(
    "/student/:studentId/exams",
    apiRateLimiter,
    requireAuth,
    requirePermission(["child.academic:read"]),
    (req, res) => container.resolve(GuardianController).getStudentExams(req, res)
);

guardianRouter.get(
    "/student/:studentId/classroom",
    apiRateLimiter,
    requireAuth,
    requirePermission(["child.timetable:read"]),
    (req, res) => container.resolve(GuardianController).getStudentClassroomDetails(req, res)
);

export default guardianRouter;
