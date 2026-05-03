import e from "express";
import { AuthenticatedRequest } from "./AuthMiddleware.js";

/**
 * Express middleware to restrict access to specific permissions (scopes).
 * Assumes AuthMiddleware (requireAuth) has already run and attached `req.user`.
 * @param requiredPermissions Array of permission keys (e.g. ['student:read', 'staff:write'])
 */
export function requirePermission(requiredPermissions: string[]) {
    return async (req: e.Request, res: e.Response, next: e.NextFunction): Promise<void> => {
        const user = (req as AuthenticatedRequest).user;
        
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized: No user context found" });
            return;
        }

        if (!user.permissions || user.permissions.length === 0) {
            res.status(403).json({ success: false, message: "Access denied. No permissions found." });
            return;
        }

        const hasPermission = requiredPermissions.some(p => user.permissions.includes(p));

        if (!hasPermission) {
            res.status(403).json({
                success: false,
                message: `Access denied. Requires one of permissions: ${requiredPermissions.join(", ")}.`,
            });
            return;
        }

        next();
    };
}
