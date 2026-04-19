import { Router } from "express";
import { container } from "tsyringe";
import StaffController from "./controllers/StaffController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";

const staffRouter = Router();

staffRouter.get("/", requireAuth, (req, res) => container.resolve(StaffController).list(req, res));
staffRouter.get("/:id", requireAuth, (req, res) => container.resolve(StaffController).get(req, res));
staffRouter.post("/", requireAuth, (req, res) => container.resolve(StaffController).create(req, res));
staffRouter.put("/:id", requireAuth, (req, res) => container.resolve(StaffController).update(req, res));
staffRouter.delete("/:id", requireAuth, (req, res) => container.resolve(StaffController).delete(req, res));

export default staffRouter;
