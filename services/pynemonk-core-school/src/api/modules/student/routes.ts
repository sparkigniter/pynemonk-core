import * as express from "express";
import { container } from "tsyringe";
import StudentController from "./controllers/StudentController.js";
import { requireAuth } from "../../../api/core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const studentRouter = express.Router();

/**
 * POST /api/v1/school/students
 * Register a new student (requires school admin or principal)
 */
studentRouter.post("/", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["student:write"]), (req, res) => {
    const ctrl = container.resolve(StudentController);
    return ctrl.create(req, res);
});

studentRouter.get("/next-admission-number", apiRateLimiter, requireAuth, requirePermission(["student:write"]), (req, res) => {
    const ctrl = container.resolve(StudentController);
    return ctrl.getNextAdmissionNumber(req, res);
});

studentRouter.get("/settings", apiRateLimiter, requireAuth, requirePermission(["settings:read"]), (req, res) => {
    const ctrl = container.resolve(StudentController);
    return ctrl.getSettings(req, res);
});

studentRouter.patch("/settings", apiRateLimiter, sensitiveRateLimiter, requireAuth, requirePermission(["settings:write"]), (req, res) => {
    const ctrl = container.resolve(StudentController);
    return ctrl.updateSettings(req, res);
});

/**
 * GET /api/v1/school/students
 * List students
 */
studentRouter.get(
    "/",
    apiRateLimiter,
    requireAuth,
    requirePermission(["student:read"]),
    (req, res) => {
        const ctrl = container.resolve(StudentController);
        return ctrl.list(req, res);
    },
);

studentRouter.get(
    "/profile/me",
    apiRateLimiter,
    requireAuth,
    (req, res) => {
        const ctrl = container.resolve(StudentController);
        return ctrl.getMe(req, res);
    }
);

/**
 * GET /api/v1/school/students/:id
 * Get single student details
 */
studentRouter.get(
    "/:id",
    apiRateLimiter,
    requireAuth,
    requirePermission(["student:read"]),
    (req, res) => {
        const ctrl = container.resolve(StudentController);
        return ctrl.get(req, res);
    },
);

/**
 * POST /api/v1/school/students/:id/documents
 * Upload a document for a student
 */
studentRouter.post(
    "/:id/documents",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["student:write"]),
    (req, res) => {
        const ctrl = container.resolve(StudentController);
        return ctrl.uploadDocument(req, res);
    },
);

studentRouter.put(
    "/:id",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["student:write"]),
    (req, res) => {
        const ctrl = container.resolve(StudentController);
        return ctrl.update(req, res);
    },
);

export default studentRouter;
