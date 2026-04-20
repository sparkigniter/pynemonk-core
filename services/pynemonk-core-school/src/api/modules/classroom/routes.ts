import { Router } from "express";
import { container } from "tsyringe";
import ClassroomController from "./controllers/ClassroomController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requireRole } from "../../core/middleware/requireRole.js";

const classroomRouter = Router();

classroomRouter.get("/", requireAuth, (req, res) =>
    container.resolve(ClassroomController).list(req, res),
);
classroomRouter.get("/:id", requireAuth, (req, res) =>
    container.resolve(ClassroomController).get(req, res),
);
classroomRouter.post(
    "/",
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(ClassroomController).create(req, res),
);
classroomRouter.put(
    "/:id",
    requireAuth,
    requireRole(["owner", "principal", "school_admin"]),
    (req, res) => container.resolve(ClassroomController).update(req, res),
);
classroomRouter.delete("/:id", requireAuth, requireRole(["owner", "principal"]), (req, res) =>
    container.resolve(ClassroomController).delete(req, res),
);

export default classroomRouter;
