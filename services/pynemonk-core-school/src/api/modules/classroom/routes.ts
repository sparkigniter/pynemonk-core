import { Router } from "express";
import { container } from "tsyringe";
import ClassroomController from "./controllers/ClassroomController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";

const classroomRouter = Router();

classroomRouter.get("/", requireAuth, (req, res) => container.resolve(ClassroomController).list(req, res));
classroomRouter.get("/:id", requireAuth, (req, res) => container.resolve(ClassroomController).get(req, res));
classroomRouter.post("/", requireAuth, (req, res) => container.resolve(ClassroomController).create(req, res));
classroomRouter.put("/:id", requireAuth, (req, res) => container.resolve(ClassroomController).update(req, res));
classroomRouter.delete("/:id", requireAuth, (req, res) => container.resolve(ClassroomController).delete(req, res));

export default classroomRouter;
