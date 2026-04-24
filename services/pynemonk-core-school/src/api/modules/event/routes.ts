import { Router } from "express";
import { container } from "tsyringe";
import EventController from "./controllers/EventController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requireRole } from "../../core/middleware/requireRole.js";

const eventRouter = Router();

eventRouter.get("/", requireAuth, (req, res) => container.resolve(EventController).list(req, res));

eventRouter.post(
    "/",
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(EventController).create(req, res)
);

eventRouter.put(
    "/:id",
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(EventController).update(req, res)
);

eventRouter.delete(
    "/:id",
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(EventController).delete(req, res)
);

export default eventRouter;
