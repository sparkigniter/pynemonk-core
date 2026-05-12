import e from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends e.Request {
    user?: {
        id: number;
        userId: number;
        tenantId: number;
        role_id: number;
        roles: string[];
        permissions: string[];
    };
}

/**
 * Express middleware that validates a Bearer JWT in the Authorization header.
 * On success it attaches the decoded payload to req.user and calls next().
 * On failure it responds 401.
 */
export function requireAuth(req: e.Request, res: e.Response, next: e.NextFunction): void {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ success: false, message: "Missing or malformed Authorization header" });
        return;
    }

    const token = authHeader.slice(7);
    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        res.status(500).json({ success: false, message: "Server misconfiguration: missing JWT secret" });
        return;
    }

    try {
        const decoded: any = jwt.verify(token, secret, { algorithms: ["HS256"] });
        // Standardize payload to camelCase for the application
        (req as any).user = {
            ...decoded,
            id: decoded.sub,
            userId: decoded.sub,
            tenantId: decoded.tenant_id
        };
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, message: "Token has expired" });
        } else {
            res.status(401).json({ success: false, message: "Invalid token" });
        }
    }
}
