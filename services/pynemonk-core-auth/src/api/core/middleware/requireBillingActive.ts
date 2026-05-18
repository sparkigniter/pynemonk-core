import e from "express";
import pool from "../../../db/pg-pool.js";

/**
 * Express middleware to enforce graceful billing suspension.
 * - Must be placed after requireAuth middleware.
 * - Restricts access dynamically based on tenant.billing_status.
 *   - 'active' or 'overdue': Full access (overdue is within the 14-day grace period).
 *   - 'readonly': Block database writes (POST, PUT, DELETE) but allow reads (GET).
 *   - 'suspended': Block all access (402 Payment Required).
 *   - Global system_admin accounts bypass the check entirely.
 */
export async function requireBillingActive(req: e.Request, res: e.Response, next: e.NextFunction): Promise<void> {
    const user = (req as any).user;

    if (!user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }

    // Bypass check for platform-wide system administrators
    if (!user.tenant_id && user.roles?.includes("system_admin")) {
        next();
        return;
    }

    const tenantId = user.tenant_id;
    if (!tenantId) {
        res.status(400).json({ success: false, message: "Missing tenant identification context" });
        return;
    }

    try {
        // Query the database directly to ensure real-time status (bypassing cached JWT token state)
        const { rows } = await pool.query(
            "SELECT billing_status, is_active FROM auth.tenant WHERE id = $1 AND is_deleted = FALSE",
            [tenantId]
        );

        if (rows.length === 0) {
            res.status(404).json({ success: false, message: "Tenant school not found or has been deleted" });
            return;
        }

        const tenant = rows[0];
        const billingStatus = tenant.billing_status || 'active';

        // 1. Check for Total Suspension
        if (billingStatus === 'suspended' || tenant.is_active === false) {
            res.status(402).json({
                success: false,
                error: "Payment Required",
                message: "Your school portal access has been suspended due to an outstanding unpaid invoice. Please make a payment to restore access."
            });
            return;
        }

        // 2. Check for Read-Only Lockdown
        if (billingStatus === 'readonly') {
            const isWriteOperation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method.toUpperCase());
            if (isWriteOperation) {
                res.status(403).json({
                    success: false,
                    error: "Forbidden",
                    message: "This school portal is in Read-Only mode due to an overdue invoice. Settle outstanding payments to re-enable database writes."
                });
                return;
            }
        }

        // 3. Fallthrough for active or overdue (grace period)
        next();
    } catch (error: any) {
        console.error("[BillingMiddleware] Database connection error:", error.message);
        res.status(500).json({ success: false, message: "Internal server error performing billing validation" });
    }
}
