import e from "express";
import pool from "../../../db/pg-pool.js";

/**
 * Express middleware to restrict access to specific roles or tiers.
 * Assumes requireAuth has already run and attached `req.user`.
 * @param allowedRoles Array of role slugs (e.g. ['owner', 'principal'])
 * @param minTier Maximum tier number allowed (lower number = higher privilege. 0 = owner)
 */
export function requireRole(allowedRoles?: string[], opts?: { minTier?: number }) {
    return async (req: e.Request, res: e.Response, next: e.NextFunction): Promise<void> => {
        const user = (req as any).user;
        console.log(`[requireRole] Validating user: ${user?.email}, role_id: ${user?.role_id}`);
        if (!user || !user.role_id) {
            console.error(`[requireRole] Access Denied: User or role_id missing from token. User: ${JSON.stringify(user)}`);
            res.status(403).json({ success: false, message: "Access denied. No role found." });
            return;
        }

        try {
            const roleRes = await pool.query(
                `SELECT slug, tier FROM auth.role WHERE id = $1 AND is_deleted = false`,
                [user.role_id]
            );

            if (roleRes.rows.length === 0) {
                res.status(403).json({ success: false, message: "Access denied. Invalid role." });
                return;
            }

            const role = roleRes.rows[0];

            // Tier check (lower tier number = higher authority)
            if (opts?.minTier !== undefined) {
                if (role.tier > opts.minTier) {
                    res.status(403).json({ 
                        success: false, 
                        message: `Access denied. Requires tier ${opts.minTier} or higher (current: ${role.tier}).`
                    });
                    return;
                }
            }

            // Explicit role check
            if (allowedRoles && allowedRoles.length > 0) {
                if (!allowedRoles.includes(role.slug)) {
                    res.status(403).json({ 
                        success: false, 
                        message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}.`
                    });
                    return;
                }
            }

            // Attach full role to req for downstream use
            (req as any).role = role;
            next();
        } catch (err) {
            console.error("Error in requireRole middleware:", err);
            res.status(500).json({ success: false, message: "Internal server error during role validation" });
        }
    };
}
