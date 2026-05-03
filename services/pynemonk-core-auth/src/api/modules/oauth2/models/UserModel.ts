import pool from "../../../../db/pg-pool.js";

/**
 * UserModel — handles user-related database operations for OAuth2.
 * Note: This model is primarily used for client-level user discovery and token generation.
 * For general user management, use the AuthService / UserHelper in the auth module.
 */
export class UserModel {
    
    /**
     * Finds a user by email.
     */
    static async findByEmail(email: string) {
        const query = `
            SELECT id, email, password_hash, tenant_id, role_id
            FROM auth.user u
            JOIN auth.user_credential uc ON u.id = uc.user_id
            WHERE email = $1 AND u.is_deleted = FALSE
        `;
        const res = await pool.query(query, [email]);
        return res.rows[0];
    }

    /**
     * Gets full identity context for a user post-login.
     * This includes roles, current tenant, and aggregated permissions (scopes).
     */
    static async getFullLoginContext(email: string, clientId: string, schoolSlug?: string) {
        const query = `
            WITH user_info AS (
                SELECT u.id, u.tenant_id, u.email, uc.password_hash 
                FROM auth.user u 
                JOIN auth.user_credential uc ON u.id = uc.user_id
                WHERE u.email = $1 AND u.is_deleted = FALSE
            ),
            all_user_roles AS (
                SELECT r.slug, r.id as role_id, r.tenant_id, ur.is_primary
                FROM auth.user_role ur
                JOIN auth.role r ON ur.role_id = r.id
                WHERE ur.user_id = (SELECT id FROM user_info) AND ur.is_deleted = FALSE
                UNION
                SELECT r.slug, r.id as role_id, r.tenant_id, TRUE as is_primary
                FROM auth.user u
                JOIN auth.role r ON u.role_id = r.id
                WHERE u.id = (SELECT id FROM user_info) AND u.is_deleted = FALSE
            ),
            selected_tenant AS (
                SELECT id, name, slug, uuid FROM auth.tenant 
                WHERE ($3::text IS NULL OR slug = $3)
                  AND ($3::text IS NOT NULL OR id = (SELECT tenant_id FROM user_info))
                LIMIT 1
            ),
            all_user_tenants AS (
                SELECT DISTINCT t.id, t.name, t.slug, t.uuid
                FROM auth.user_role ur
                JOIN auth.role r ON ur.role_id = r.id
                JOIN auth.tenant t ON r.tenant_id = t.id
                WHERE ur.user_id = (SELECT id FROM user_info) AND ur.is_deleted = FALSE
            ),
            role_permissions AS (
                -- Source #1: Explicit Client-Role-Scope Whitelist
                SELECT s.value
                FROM auth.client_role_scope crs
                JOIN auth.scope s ON crs.scope_id = s.id
                JOIN auth.client c ON crs.client_id = c.id
                WHERE crs.role_id IN (SELECT role_id FROM all_user_roles)
                  AND c.client_id = $2
                  AND crs.granted = TRUE
                
                UNION

                -- Source #2: Role-Scope Assignment (Fallback)
                SELECT s.value
                FROM auth.role_scope rs
                JOIN auth.scope s ON rs.scope_id = s.id
                WHERE rs.role_id IN (SELECT role_id FROM all_user_roles)
                  AND rs.granted = TRUE
                  AND (rs.tenant_id IS NULL OR rs.tenant_id = (SELECT tenant_id FROM user_info))
            ),
            client_info AS (
                SELECT id FROM auth.client WHERE client_id = $2
            ),
            client_permissions AS (
                SELECT s.value
                FROM auth.client_scope cs
                JOIN auth.scope s ON cs.scope_id = s.id
                WHERE cs.client_id = (SELECT id FROM client_info)
            )
            SELECT 
                u.id as user_id, u.email, u.password_hash,
                (SELECT JSON_AGG(t) FROM selected_tenant t) as current_tenant,
                (SELECT JSON_AGG(t) FROM all_user_tenants t) as all_tenants,
                (SELECT JSON_AGG(r) FROM all_user_roles r) as all_roles,
                COALESCE((
                    SELECT ARRAY_AGG(DISTINCT value) FROM (
                        SELECT value FROM role_permissions
                        WHERE EXISTS (SELECT 1 FROM client_permissions)
                          AND value IN (SELECT value FROM client_permissions)
                        UNION
                        SELECT value FROM role_permissions
                        WHERE NOT EXISTS (SELECT 1 FROM client_permissions)
                    ) p
                ), '{}') as permissions
            FROM user_info u;
        `;

        const res = await pool.query(query, [email, clientId, schoolSlug || null]);
        const row = res.rows[0];
        if (!row) return null;

        return {
            user_id: row.user_id,
            email: row.email,
            password: row.password_hash,
            tenant_id: row.current_tenant ? row.current_tenant[0].id : null,
            roles: row.all_roles || [],
            permissions: row.permissions || []
        };
    }
}