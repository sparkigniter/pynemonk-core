import { Router } from "express";
import { container } from "tsyringe";
import AdmissionController from "./controllers/AdmissionController.js";
import { PublicAdmissionController } from "./controllers/PublicAdmissionController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";
import { AuthenticatedRequest } from "../../core/middleware/AuthMiddleware.js";

const router = Router();

// --- PUBLIC ROUTES (No Auth) ---
router.get("/public/:slug", apiRateLimiter, (req, res) => {
    return container.resolve(PublicAdmissionController).getPublicSchoolInfo(req, res);
});

router.post("/public/submit", apiRateLimiter, sensitiveRateLimiter, (req, res) => {
    return container.resolve(PublicAdmissionController).submitPublicApplication(req, res);
});

// --- AUTHENTICATED ROUTES ---
router.post(
    "/",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["student:write"]),
    (req, res) => container.resolve(AdmissionController).admit(req as AuthenticatedRequest, res),
);

// 2. Multistage Workflow
router.post(
    "/workflow/start",
    apiRateLimiter,
    requireAuth,
    requirePermission(["student:write"]),
    (req, res) => container.resolve(AdmissionController).startWorkflow(req as AuthenticatedRequest, res),
);

router.patch(
    "/workflow/:id",
    apiRateLimiter,
    requireAuth,
    requirePermission(["student:write"]),
    (req, res) => container.resolve(AdmissionController).updateWorkflow(req as AuthenticatedRequest, res),
);

router.post(
    "/workflow/:id/finalize",
    apiRateLimiter,
    requireAuth,
    requirePermission(["student:write"]),
    (req, res) => container.resolve(AdmissionController).finalizeWorkflow(req as AuthenticatedRequest, res),
);

// 3. Application List/Management
router.get(
    "/applications",
    apiRateLimiter,
    requireAuth,
    requirePermission(["student:read"]),
    (req, res) => container.resolve(AdmissionController).listApplications(req as AuthenticatedRequest, res),
);

router.get(
    "/workflow/:id",
    apiRateLimiter,
    requireAuth,
    requirePermission(["student:read"]),
    (req, res) => container.resolve(AdmissionController).getApplication(req as AuthenticatedRequest, res),
);

export default router;
