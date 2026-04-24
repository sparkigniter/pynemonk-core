import * as express from "express";
import { container } from "tsyringe";
import StudentController from "./controllers/StudentController.js";
import { requireAuth } from "../../../api/core/middleware/requireAuth.js";
import { requireRole } from "../../../api/core/middleware/requireRole.js";

const studentRouter = express.Router();

/**
 * POST /api/v1/school/students
 * Register a new student (requires school admin or principal)
 */
studentRouter.post("/", requireAuth, requireRole(["school_admin", "principal"]), (req, res) => {
    const ctrl = container.resolve(StudentController);
    return ctrl.create(req, res);
});

/**
 * GET /api/v1/school/students
 * List students
 */
studentRouter.get(
    "/",
    requireAuth,
    requireRole(["school_admin", "principal", "teacher"]),
    (req, res) => {
        const ctrl = container.resolve(StudentController);
        return ctrl.list(req, res);
    },
);

studentRouter.get(
    "/profile/me",
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
    requireAuth,
    requireRole(["school_admin", "principal", "teacher"]),
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
    requireAuth,
    requireRole(["school_admin", "principal"]),
    (req, res) => {
        const ctrl = container.resolve(StudentController);
        return ctrl.uploadDocument(req, res);
    },
);

export default studentRouter;
