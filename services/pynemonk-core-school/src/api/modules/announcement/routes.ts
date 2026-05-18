import { Router } from "express";
import { container } from "tsyringe";
import { AnnouncementController } from "./controllers/AnnouncementController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const router = Router();

router.use(requireAuth);

router.get("/", apiRateLimiter, (req, res) => container.resolve(AnnouncementController).list(req, res));
router.post("/", apiRateLimiter, sensitiveRateLimiter, (req, res) => container.resolve(AnnouncementController).create(req, res));
router.put("/:id", apiRateLimiter, sensitiveRateLimiter, (req, res) => container.resolve(AnnouncementController).update(req, res));
router.delete("/:id", apiRateLimiter, sensitiveRateLimiter, (req, res) => container.resolve(AnnouncementController).delete(req, res));

export default router;
