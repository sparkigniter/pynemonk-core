import * as express from "express";
import { container } from "tsyringe";
import PaymentController from "./controllers/PaymentController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";

const paymentRouter = express.Router();

// Public webhook endpoint (bypasses authentication for payment gateways)
paymentRouter.post("/webhook", (req, res) => {
    return container.resolve(PaymentController).handleWebhook(req, res);
});

// Secure payment routes
paymentRouter.get("/config", requireAuth, (req, res) => {
    return container.resolve(PaymentController).getConfig(req, res);
});

paymentRouter.post("/checkout-session", requireAuth, (req, res) => {
    return container.resolve(PaymentController).createCheckoutSession(req, res);
});

paymentRouter.get("/transactions", requireAuth, (req, res) => {
    return container.resolve(PaymentController).listTransactions(req, res);
});

export default paymentRouter;
