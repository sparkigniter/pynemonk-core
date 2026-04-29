import { Router } from "express";
import { container } from "tsyringe";
import GuardianController from "./controllers/GuardianController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requireRole } from "../../core/middleware/requireRole.js";

const guardianRouter = Router();

// Parent specific routes
guardianRouter.get(
    "/my-students", 
    requireAuth, 
    requireRole(["parent"]), 
    (req, res) => container.resolve(GuardianController).getMyStudents(req, res)
);

guardianRouter.get(
    "/student/:studentId/attendance",
    requireAuth,
    requireRole(["parent"]),
    (req, res) => container.resolve(GuardianController).getStudentAttendance(req, res)
);

guardianRouter.get(
    "/student/:studentId/exams",
    requireAuth,
    requireRole(["parent"]),
    (req, res) => container.resolve(GuardianController).getStudentExams(req, res)
);

guardianRouter.get(
    "/student/:studentId/classroom",
    requireAuth,
    requireRole(["parent"]),
    (req, res) => container.resolve(GuardianController).getStudentClassroomDetails(req, res)
);

export default guardianRouter;
