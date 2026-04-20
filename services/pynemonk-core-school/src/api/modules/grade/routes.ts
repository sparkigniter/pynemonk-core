import { Router } from "express";
import { container } from "tsyringe";
import { GradeController } from "./controllers/GradeController.js";
import { AuthMiddleware, AuthenticatedRequest } from "../../core/middleware/AuthMiddleware.js";

const router = Router();

// Lazy resolve components inside handlers to avoid DI timing issues
router.post("/", (req, res) => {
    container.resolve(AuthMiddleware).handle(req as unknown as AuthenticatedRequest, res, () => {
        container.resolve(GradeController).create(req as unknown as AuthenticatedRequest, res);
    });
});

router.get("/", (req, res) => {
    container.resolve(AuthMiddleware).handle(req as unknown as AuthenticatedRequest, res, () => {
        container.resolve(GradeController).list(req as unknown as AuthenticatedRequest, res);
    });
});

router.put("/:id", (req, res) => {
    container.resolve(AuthMiddleware).handle(req as unknown as AuthenticatedRequest, res, () => {
        container.resolve(GradeController).update(req as unknown as AuthenticatedRequest, res);
    });
});

router.delete("/:id", (req, res) => {
    container.resolve(AuthMiddleware).handle(req as unknown as AuthenticatedRequest, res, () => {
        container.resolve(GradeController).delete(req as unknown as AuthenticatedRequest, res);
    });
});

export default router;
