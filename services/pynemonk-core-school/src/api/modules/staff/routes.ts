import { Router } from "express";
import { container } from "tsyringe";
import StaffController from "./controllers/StaffController.js";
import RoleController from "./controllers/RoleController.js";
import TeacherController from "./controllers/TeacherController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";
import { AuthMiddleware, AuthenticatedRequest } from "../../core/middleware/AuthMiddleware.js";

const staffRouter = Router();
// ── Teacher Specific Routes ───────────────────────────────────────────────
// ── Teacher Specific Routes ───────────────────────────────────────────────
staffRouter.get("/teacher/dashboard", apiRateLimiter, requireAuth, requirePermission(["student.academic:read"]), (req, res) => container.resolve(TeacherController).getDashboard(req, res));
staffRouter.get("/teacher/timetable", apiRateLimiter, requireAuth, requirePermission(["timetable:read"]), (req, res) => container.resolve(TeacherController).getTimetable(req, res));
staffRouter.get("/teacher/exams", apiRateLimiter, requireAuth, requirePermission(["student.academic:read"]), (req, res) => container.resolve(TeacherController).getExams(req, res));
staffRouter.get("/teacher/class/:classroomId/students", apiRateLimiter, requireAuth, requirePermission(["student:read"]), (req, res) => container.resolve(TeacherController).getClassroomStudents(req, res));

// ── Staff Profiles ────────────────────────────────────────────────────────
staffRouter.get("/", apiRateLimiter, requireAuth, requirePermission(["staff:read"]), (req, res) => container.resolve(StaffController).list(req, res));
staffRouter.get("/:id", apiRateLimiter, requireAuth, requirePermission(["staff:read"]), (req, res) =>
    container.resolve(StaffController).get(req, res),
);
staffRouter.get("/profile/me", apiRateLimiter, requireAuth, (req, res) =>
    container.resolve(StaffController).getMe(req, res),
);
staffRouter.post(
    "/",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["staff:write"]),
    (req, res) => container.resolve(StaffController).create(req, res),
);
staffRouter.put(
    "/:id",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["staff:write"]),
    (req, res) => container.resolve(StaffController).update(req, res),
);
staffRouter.delete("/:id", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["staff:write"]), (req, res) =>
    container.resolve(StaffController).delete(req, res),
);

// ── Role Management ───────────────────────────────────────────────────────
staffRouter.get(
    "/roles/available",
    apiRateLimiter,
    requireAuth,
    requirePermission(["settings:read"]),
    (req, res) =>
        container.resolve(RoleController).listAvailableRoles(req as AuthenticatedRequest, res),
);

staffRouter.get(
    "/roles/me",
    apiRateLimiter,
    requireAuth,
    (req, res) => container.resolve(RoleController).getMyRoles(req as AuthenticatedRequest, res),
);

staffRouter.post(
    "/roles/assign",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["user:invite"]),
    (req, res) => container.resolve(RoleController).assignRole(req as AuthenticatedRequest, res),
);

staffRouter.delete(
    "/roles/remove",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["user:invite"]),
    (req, res) => container.resolve(RoleController).removeRole(req as AuthenticatedRequest, res),
);

export default staffRouter;
