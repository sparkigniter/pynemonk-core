import { Router } from "express";
import { container } from "tsyringe";
import ReportController from "./controllers/ReportController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const router = Router();

// Expose customizable templates
router.get(
    "/reports/templates",
    apiRateLimiter,
    requireAuth,
    requirePermission("report.financial:read"),
    (req, res) => container.resolve(ReportController).getTemplates(req, res)
);

router.post(
    "/reports/templates",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission("settings:write"),
    (req, res) => container.resolve(ReportController).saveTemplate(req, res)
);

// Synchronous report generation returning raw buffers
router.get(
    "/reports/generate/:type",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission("report.financial:read"),
    (req, res) => container.resolve(ReportController).generateSync(req, res)
);

// Offline background report jobs
router.post(
    "/reports/jobs",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission("report.financial:read"),
    (req, res) => container.resolve(ReportController).triggerJob(req, res)
);

router.get(
    "/reports/jobs",
    apiRateLimiter,
    requireAuth,
    requirePermission("report.financial:read"),
    (req, res) => container.resolve(ReportController).getJobsList(req, res)
);

router.get(
    "/reports/jobs/:id",
    apiRateLimiter,
    requireAuth,
    requirePermission("report.financial:read"),
    (req, res) => container.resolve(ReportController).getJobStatus(req, res)
);

router.get(
    "/reports/jobs/:id/download",
    apiRateLimiter,
    requireAuth,
    requirePermission("report.financial:read"),
    (req, res) => container.resolve(ReportController).downloadJobOutput(req, res)
);

export default router;
