import { Router } from "express";
import { container } from "tsyringe";
import { SystemController } from "./controllers/SystemController.js";

const router = Router();

router.get("/stats", (req, res) => container.resolve(SystemController).getStats(req, res));

export default router;
