import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface UserContext {
    userId: number;
    email: string;
    roles: string[];
    tenantId: number;
    primaryRoleId: number;
}

/**
 * Middleware to authenticate requests via JWT and populate req.user context.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback_access_secret_32_chars_long') as any;
        
        // Populate context
        (req as any).user = {
            userId: parseInt(decoded.sub, 10),
            email: decoded.email,
            roles: decoded.roles || [],
            tenantId: decoded.tenant_id,
            primaryRoleId: decoded.role_id
        } as UserContext;

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};
