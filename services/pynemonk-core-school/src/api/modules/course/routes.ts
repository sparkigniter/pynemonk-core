import { Router } from "express";
import { container } from "tsyringe";
import CourseController from "./controllers/CourseController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { requireRole } from "../../core/middleware/requireRole.js";

const courseRouter = Router();

courseRouter.get("/", requireAuth, (req, res) => container.resolve(CourseController).list(req, res));
courseRouter.get("/:id", requireAuth, (req, res) => container.resolve(CourseController).get(req, res));
courseRouter.post("/", requireAuth, requireRole(["owner", "principal", "school_admin"]), (req, res) => container.resolve(CourseController).create(req, res));
courseRouter.put("/:id", requireAuth, requireRole(["owner", "principal", "school_admin"]), (req, res) => container.resolve(CourseController).update(req, res));
courseRouter.delete("/:id", requireAuth, requireRole(["owner", "principal"]), (req, res) => container.resolve(CourseController).delete(req, res));

export default courseRouter;
