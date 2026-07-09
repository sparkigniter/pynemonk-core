import { Request, Response, NextFunction } from "express";

/**
 * Middleware to restrict access based on the 'scope' field in the JWT.
 * @param permission The required scope string (e.g., 'report.financial:read')
 */
export function requirePermission(permission: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as any).user;

        if (!user || !user.scope) {
            res.status(403).json({ 
                success: false, 
                message: "Access denied. No permissions found in token." 
            });
            return;
        }

        const scopes = user.scope.split(" ");
        
        // Check if the exact permission exists or if the user has '*' (super admin)
        if (!scopes.includes(permission) && !scopes.includes("*") && !scopes.includes("admin")) {
            res.status(403).json({ 
                success: false, 
                message: `Access denied. Requires permission: ${permission}` 
                
            });
            return;
        }

        next();
    };
}
