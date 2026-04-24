import { Router } from "express";
import rateLimit from "express-rate-limit";
import { container } from "tsyringe";
import EventController from "./controllers/EventController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requireRole } from "../../core/middleware/requireRole.js";

const eventRouter = Router();

const eventRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
});

eventRouter.get("/", eventRateLimiter, requireAuth, (req, res) => container.resolve(EventController).list(req, res));

eventRouter.post(
    "/",
    requireAuth,
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(EventController).create(req, res)
);

eventRouter.put(
    "/:id",
    requireAuth,
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(EventController).update(req, res)
);

eventRouter.delete(
    "/:id",
    requireAuth,
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(EventController).delete(req, res)
);

export default eventRouter;
