import { Router } from "express";
import { container } from "tsyringe";
import AdmissionController from "./controllers/AdmissionController.ts";
import AuthMiddleware from "../../../core/middleware/AuthMiddleware.ts";

const router = Router();
const controller = container.resolve(AdmissionController);
const auth = container.resolve(AuthMiddleware);

// Only admissions_officer and school_admin should be able to process admissions
router.post(
    "/", 
    auth.handle, 
    auth.authorize(["admissions_officer", "school_admin"]),
    controller.admit
);

export default router;
