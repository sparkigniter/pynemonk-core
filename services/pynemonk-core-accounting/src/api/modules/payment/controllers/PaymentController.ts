import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import PaymentService from "../services/PaymentService.js";
import BaseController from "../../../core/controllers/BaseController.js";

@injectable()
export default class PaymentController extends BaseController {
    constructor(@inject(PaymentService) private paymentService: PaymentService) {
        super();
    }

    /**
     * GET /payments/config
     * Public endpoint to get basic publishable configurations for checkout mounting
     */
    public async getConfig(req: any, res: Response) {
        try {
            const tenantId = req.user.tenantId;
            const config = await this.paymentService.getPaymentConfig(tenantId);
            return this.ok(res, "Payment configuration retrieved", config);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    /**
     * POST /payments/checkout-session
     * Initiates Stripe/Razorpay checkout or mock session creation
     */
    public async createCheckoutSession(req: any, res: Response) {
        try {
            const tenantId = req.user.tenantId;
            const userId = req.user.userId;
            const { invoiceId, amount } = req.body;
            
            const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;

            if (!invoiceId) {
                return this.badrequest(res, "invoiceId is a required parameter.");
            }

            const session = await this.paymentService.createCheckoutSession(
                tenantId,
                userId,
                Number(invoiceId),
                Number(amount),
                origin
            );

            return this.ok(res, "Checkout session established successfully", session);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    /**
     * POST /payments/webhook
     * Webhook endpoint called by Payment Gateways (Stripe, Razorpay, or simulated checkout)
     */
    public async handleWebhook(req: any, res: Response) {
        try {
            // For webhook verification and routing:
            // 1. Check for a query or body tenant_id (useful for mock trigger / testing)
            // 2. Otherwise fallback to req.user.tenantId if authenticated (manual trigger)
            const tenantId = parseInt(req.query.tenant_id || req.body.tenant_id || (req.user ? req.user.tenantId : null));
            
            if (!tenantId) {
                return this.badrequest(res, "tenant_id parameter is required for webhook routing.");
            }

            const { gateway, reference, status, error_message } = req.body;

            if (!gateway || !reference) {
                return this.badrequest(res, "gateway and reference are required parameters in the payload.");
            }

            const isSuccess = status === "success";

            const result = await this.paymentService.processWebhook(
                tenantId,
                gateway,
                reference,
                isSuccess,
                error_message
            );

            return this.ok(res, "Webhook processed successfully", result);
        } catch (error: any) {
            console.error("[Webhook Error]:", error.message);
            return this.internalservererror(res, error.message);
        }
    }

    /**
     * GET /payments/transactions
     * Returns history of online gateway attempts for audit/ledger tracing
     */
    public async listTransactions(req: any, res: Response) {
        try {
            const tenantId = req.user.tenantId;
            const transactions = await this.paymentService.getTransactions(tenantId);
            return this.ok(res, "Transactions audited successfully", transactions);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
