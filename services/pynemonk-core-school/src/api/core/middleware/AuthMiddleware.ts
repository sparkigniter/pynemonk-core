import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { injectable } from "tsyringe";

export interface UserContext {
    userId: number;
    tenantId: number;
    roles: string[];
    permissions: string[];
    email: string;
    [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
    user: UserContext;
}

@injectable()
export class AuthMiddleware {
    /**
     * Extracts and validates the JWT from the Authorization header,
     * attaching the decoded user context to the request.
     */
    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        console.log(`[AuthMiddleware] Incoming ${req.method} request to ${req.path}`);
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "Missing or malformed Authorization header",
            });
            return;
        }

        const token = authHeader.slice(7);
        const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "default_secret";

        try {
            const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as any;

            // Standardize context fields (mapping from JWT claims if necessary)
            (req as AuthenticatedRequest).user = {
                userId: decoded.sub || decoded.userId || decoded.id,
                tenantId: decoded.tenant_id || decoded.tenantId || decoded.tid,
                roles: decoded.roles || [],
                permissions: typeof decoded.scope === "string" ? decoded.scope.split(" ") : [],
                email: decoded.email,
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

    /**
     * Middleware factory that requires the user to have at least one of the specified roles.
     */
    public authorize(requiredRoles: string[]) {
        return (req: Request, res: Response, next: NextFunction) => {
            const user = (req as AuthenticatedRequest).user;
            if (!user) {
                return res
                    .status(401)
                    .json({ success: false, message: "Unauthorized: No user context found" });
            }

            const hasRole = user.roles.some((role) => requiredRoles.includes(role));
            if (!hasRole) {
                return res
                    .status(403)
                    .json({ success: false, message: "Forbidden: Insufficient permissions" });
            }

            next();
        };
    }

    /**
     * Middleware factory that requires the user to have at least one of the specified permissions (scopes).
     */
    public authorizePermission(requiredPermissions: string[]) {
        return (req: Request, res: Response, next: NextFunction) => {
            const user = (req as AuthenticatedRequest).user;
            if (!user) {
                return res
                    .status(401)
                    .json({ success: false, message: "Unauthorized: No user context found" });
            }

            const hasPermission = requiredPermissions.some((p) => user.permissions.includes(p));
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `Forbidden: Insufficient permissions. Requires one of: ${requiredPermissions.join(
                        ", ",
                    )}`,
                });
            }

            next();
        };
    }
}
