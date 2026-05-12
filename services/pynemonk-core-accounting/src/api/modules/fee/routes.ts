import * as express from "express";
import { container } from "tsyringe";
import FeeCategoryController from "./controllers/FeeCategoryController.js";
import FeePaymentController from "./controllers/FeePaymentController.js";
import FeeInvoiceController from "./controllers/FeeInvoiceController.js";
import { requireAuth } from "../../../api/core/middleware/requireAuth.js";
import { requireRole } from "../../../api/core/middleware/requireRole.js";

const feeRouter = express.Router();

/**
 * POST /api/v1/accounting/fees/categories
 * Create a new fee category (requires school admin or accountant)
 */
feeRouter.post("/categories", requireAuth, requireRole(["school_admin", "accountant", "owner"]), (req, res) => {
    const ctrl = container.resolve(FeeCategoryController);
    return ctrl.create(req, res);
});

/**
 * GET /api/v1/accounting/fees/categories
 * List fee categories
 */
feeRouter.get("/categories", requireAuth, requireRole(["school_admin", "accountant", "owner", "principal"]), (req, res) => {
    const ctrl = container.resolve(FeeCategoryController);
    return ctrl.list(req, res);
});

/**
 * Payments
 */
feeRouter.get("/payments", requireAuth, (req, res) => container.resolve(FeePaymentController).list(req, res));
feeRouter.post("/payments", requireAuth, (req, res) => container.resolve(FeePaymentController).create(req, res));
feeRouter.get("/payments/:id", requireAuth, (req, res) => container.resolve(FeePaymentController).get(req, res));
feeRouter.delete("/payments/:id", requireAuth, (req, res) => container.resolve(FeePaymentController).delete(req, res));

feeRouter.post("/invoices/batch-generate", requireAuth, requireRole(["school_admin", "accountant", "owner"]), (req, res) => {
    return container.resolve(FeeInvoiceController).batchGenerate(req, res);
});

feeRouter.delete("/invoices/:id", requireAuth, requireRole(["school_admin", "accountant", "owner"]), (req, res) => {
    return container.resolve(FeeInvoiceController).void(req, res);
});

export default feeRouter;
