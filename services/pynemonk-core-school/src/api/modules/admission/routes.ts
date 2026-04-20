import { Router } from "express";
import { container } from "tsyringe";
import AdmissionController from "./controllers/AdmissionController.js";
import { AuthMiddleware, AuthenticatedRequest } from "../../core/middleware/AuthMiddleware.js";

const router = Router();
// Only admissions_officer and school_admin should be able to process admissions
router.post(
    "/",
    (req, res, next) => container.resolve(AuthMiddleware).handle(req, res, next),
    (req, res, next) =>
        container
            .resolve(AuthMiddleware)
            .authorize(["owner", "principal", "school_admin", "admissions_officer"])(
            req,
            res,
            next,
        ),
    (req, res) => container.resolve(AdmissionController).admit(req as AuthenticatedRequest, res),
);

export default router;
