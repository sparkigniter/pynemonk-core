import e from "express";

/**
 * Middleware to check if the authenticated user has a specific permission (scope).
 * Must be used after requireAuth.
 */
export function requirePermission(permission: string) {
    return (req: e.Request, res: e.Response, next: e.NextFunction): void => {
        const user = (req as any).user;
        
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const scopes = typeof user.scope === 'string' ? user.scope.split(' ') : [];
        
        if (scopes.includes(permission)) {
            next();
        } else {
            res.status(403).json({ 
                success: false, 
                message: `Forbidden: Missing required permission [${permission}]` 
            });
        }
    };
}
