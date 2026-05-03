import { Router } from "express";
import { container } from "tsyringe";
import EventController from "./controllers/EventController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requirePermission } from "../../core/middleware/requirePermission.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const eventRouter = Router();

eventRouter.get("/", apiRateLimiter, requireAuth, requirePermission(["announcement:read"]), (req, res) => container.resolve(EventController).list(req, res));

eventRouter.post(
    "/",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["announcement:write"]),
    (req, res) => container.resolve(EventController).create(req, res)
);

eventRouter.put(
    "/:id",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["announcement:write"]),
    (req, res) => container.resolve(EventController).update(req, res)
);

eventRouter.delete(
    "/:id",
    apiRateLimiter,
    sensitiveRateLimiter,
    requireAuth,
    requirePermission(["announcement:write"]),
    (req, res) => container.resolve(EventController).delete(req, res)
);

export default eventRouter;
