import { Router } from "express";
import { container } from "tsyringe";
import IntegrationController from "./controllers/IntegrationController.js";

const router = Router();

router.get("/available", (req, res) => {
    const controller = container.resolve(IntegrationController);
    return controller.listAvailable(req, res);
});

router.post("/:systemSlug/toggle", (req, res) => {
    const controller = container.resolve(IntegrationController);
    return controller.toggle(req, res);
});

router.all("/:systemSlug/actions/:action", (req, res) => {
    const controller = container.resolve(IntegrationController);
    return controller.execute(req, res);
});

export default router;
