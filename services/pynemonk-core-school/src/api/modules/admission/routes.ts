import { Router } from "express";
import { container } from "tsyringe";
import AdmissionController from "./controllers/AdmissionController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";
import { AuthenticatedRequest } from "../../core/middleware/AuthMiddleware.js";

const router = Router();

// Only users with student:write permission can process admissions
router.post(
    "/",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["student:write"]),
    (req, res) => container.resolve(AdmissionController).admit(req as AuthenticatedRequest, res),
);

export default router;
