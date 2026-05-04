import { inject, injectable } from "tsyringe";
import type { RegisterUserRequest, UserRecord } from "../../../../types/User.js";

/**
 * Raw DB helper for the auth.user and auth.user_credential tables.
 * All queries stay here — nothing else touches the DB directly.
 */
@injectable()
class UserHelper {

    protected db: any;

    constructor(@inject("DB") DB: any) {
        this.db = DB;
    }

    // ── User ─────────────────────────────────────────────────────────────────

    public async createUser(email: string, roleId: number): Promise<UserRecord> {
        const query = `
            INSERT INTO auth.user (email, role_id, is_deleted, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, role_id, is_deleted, created_at, updated_at;
        `;
        const res = await this.db.query(query, [email, roleId, false, new Date(), new Date()]);

        // Also assign the initial role in the join table
        await this.assignRole(res.rows[0].id, roleId, true);

        return res.rows[0];
    }

    public async assignRole(userId: number, roleId: number, isPrimary: boolean = false): Promise<void> {
        await this.db.query(
            `INSERT INTO auth.user_role (user_id, role_id, is_primary)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, role_id) DO UPDATE SET is_primary = $3, is_deleted = FALSE`,
            [userId, roleId, isPrimary]
        );
    }

    public async getUserRoles(userId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT r.id, r.slug, r.name, r.tier, r.tenant_id, r.data_scope, ur.is_primary
             FROM auth.role r
             JOIN auth.user_role ur ON r.id = ur.role_id
             WHERE ur.user_id = $1 AND ur.is_deleted = FALSE
             
             UNION
             
             SELECT r.id, r.slug, r.name, r.tier, r.tenant_id, r.data_scope, TRUE as is_primary
             FROM auth.role r
             JOIN auth.user u ON r.id = u.role_id
             WHERE u.id = $1 AND u.is_deleted = FALSE
             
             ORDER BY tier ASC`,
            [userId]
        );
        return res.rows;
    }

    public async getUserTenants(userId: number): Promise<any[]> {
        const res = await this.db.query(
            `SELECT DISTINCT t.id, t.uuid, t.name, t.slug
             FROM auth.tenant t
             LEFT JOIN auth.role r ON t.id = r.tenant_id
             LEFT JOIN auth.user_role ur ON r.id = ur.role_id
             LEFT JOIN auth.user u ON u.id = $1
             WHERE t.is_deleted = FALSE
               AND (
                 (ur.user_id = $1 AND ur.is_deleted = FALSE)
                 OR 
                 (u.tenant_id = t.id AND u.is_deleted = FALSE)
               )`,
            [userId]
        );
        return res.rows;
    }

    public async getUserByEmail(email: string): Promise<UserRecord | undefined> {
        const res = await this.db.query(
            `SELECT id, tenant_id, email, role_id, is_deleted, created_at, updated_at
             FROM auth.user WHERE email = $1 AND is_deleted = $2`,
            [email, false]
        );
        return res.rows[0];
    }

    public async getUserById(id: number): Promise<UserRecord | undefined> {
        const res = await this.db.query(
            `SELECT id, tenant_id, email, role_id, is_deleted, created_at, updated_at
             FROM auth.user WHERE id = $1 AND is_deleted = $2`,
            [id, false]
        );
        return res.rows[0];
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    public async createProfile(
        userId: number,
        firstName?: string,
        lastName?: string,
        phone?: string
    ): Promise<any> {
        const query = `
            INSERT INTO auth.user_profile (user_id, first_name, last_name, phone, is_deleted, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, user_id, first_name, last_name, phone;
        `;
        const res = await this.db.query(query, [
            userId,
            firstName ?? null,
            lastName ?? null,
            phone ?? null,
            false,
            new Date(),
            new Date(),
        ]);
        return res.rows[0];
    }

    // ── Credentials ───────────────────────────────────────────────────────────

    public async createCredential(userId: number, passwordHash: string): Promise<void> {
        const query = `
            INSERT INTO auth.user_credential (user_id, password_hash, is_deleted, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5);
        `;
        await this.db.query(query, [userId, passwordHash, false, new Date(), new Date()]);
    }

    public async getPasswordHash(userId: number): Promise<string | undefined> {
        const res = await this.db.query(
            `SELECT password_hash FROM auth.user_credential
             WHERE user_id = $1 AND is_deleted = $2`,
            [userId, false]
        );
        return res.rows[0]?.password_hash;
    }

    // ── Refresh tokens ────────────────────────────────────────────────────────

    public async saveRefreshToken(
        userId: number,
        clientId: number,
        token: string,
        expiresAt: Date
    ): Promise<void> {
        await this.db.query(
            `INSERT INTO auth.refresh_token (user_id, client_id, token, expires_at, revoked, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, clientId, token, expiresAt, false, new Date()]
        );
    }

    public async getRefreshToken(token: string): Promise<any> {
        const res = await this.db.query(
            `SELECT id, user_id, client_id, token, expires_at, revoked
             FROM auth.refresh_token WHERE token = $1`,
            [token]
        );
        return res.rows[0];
    }

    public async revokeRefreshToken(token: string): Promise<void> {
        await this.db.query(
            `UPDATE auth.refresh_token SET revoked = $1 WHERE token = $2`,
            [true, token]
        );
    }

    public async revokeAllUserRefreshTokens(userId: number): Promise<void> {
        await this.db.query(
            `UPDATE auth.refresh_token SET revoked = $1 WHERE user_id = $2`,
            [true, userId]
        );
    }

    // ── Tenant ────────────────────────────────────────────────────────────────
    public async getTenantBySlug(slug: string): Promise<any> {
        const res = await this.db.query(
            `SELECT id, uuid, name, slug FROM auth.tenant WHERE slug = $1 AND is_deleted = FALSE`,
            [slug]
        );
        return res.rows[0];
    }

    /**
     * Highly Architectured Permission Retrieval:
     * Fetches all 'Effective Permissions' for a user by aggregating:
     * 1. Permissions assigned via Roles (relational join)
     * 2. Permissions assigned via Roles (legacy JSONB data_scope)
     * 3. (Optional future) Permissions assigned directly to User
     */
    public async getEffectivePermissions(userId: number, clientId: string, tenant_id?: number): Promise<string[]> {
        const query = `
            WITH all_user_roles AS (
                SELECT r.id as role_id
                FROM auth.user_role ur
                JOIN auth.role r ON ur.role_id = r.id
                WHERE ur.user_id = $1 AND ur.is_deleted = FALSE
                UNION
                SELECT r.id as role_id
                FROM auth.user u
                JOIN auth.role r ON u.role_id = r.id
                WHERE u.id = $1 AND u.is_deleted = FALSE
            )
            SELECT DISTINCT s.value as key
            FROM auth.client_role_scope crs
            JOIN auth.scope s ON crs.scope_id = s.id
            JOIN auth.client c ON crs.client_id = c.id
            WHERE crs.role_id IN (SELECT role_id FROM all_user_roles)
              AND c.client_id = $2
              AND crs.granted = TRUE
        `;

        const res = await this.db.query(query, [userId, clientId]);
        return res.rows.map((r: { key: string }) => r.key);
    }
    /**
     * Super Login Query - Consolidates all authentication and identity data
     * Fetches: Credentials, Tenants, Roles, and Effective Scopes in one trip.
     */
    public async getFullLoginContext(email: string, clientId: string, schoolSlug?: string): Promise<any> {
        const query = `
            WITH user_info AS (
                -- Identify the user and their home tenant
                SELECT u.id, u.tenant_id, u.email, uc.password_hash 
                FROM auth.user u 
                JOIN auth.user_credential uc ON u.id = uc.user_id
                WHERE u.email = $1 AND u.is_deleted = FALSE
            ),
            all_user_roles AS (
                -- Identify ALL active role IDs for this user
                SELECT r.id as role_id, r.tenant_id, r.slug
                FROM auth.user_role ur
                JOIN auth.role r ON ur.role_id = r.id
                WHERE ur.user_id = (SELECT id FROM user_info) AND ur.is_deleted = FALSE
                UNION
                SELECT r.id as role_id, r.tenant_id, r.slug
                FROM auth.user u
                JOIN auth.role r ON u.role_id = r.id
                WHERE u.id = (SELECT id FROM user_info) AND u.is_deleted = FALSE
            ),
            selected_tenant AS (
                -- Resolve the current school context
                SELECT id, name, slug, uuid FROM auth.tenant 
                WHERE is_deleted = FALSE
                  AND (($3::text IS NULL AND id = (SELECT tenant_id FROM user_info)) OR ($3::text IS NOT NULL AND slug = $3))
                LIMIT 1
            ),
            all_user_tenants AS (
                -- List all schools the user has access to
                SELECT DISTINCT t.id, t.name, t.slug, t.uuid
                FROM auth.user_role ur
                JOIN auth.role r ON ur.role_id = r.id
                JOIN auth.tenant t ON r.tenant_id = t.id
                WHERE ur.user_id = (SELECT id FROM user_info) AND ur.is_deleted = FALSE AND t.is_deleted = FALSE
            ),
            effective_permissions AS (
                -- SOURCE 1: App-Specific Role Scopes (The primary Admin UI target)
                -- This is now the strict, single source of truth for permissions.
                SELECT s.value
                FROM auth.client_role_scope crs
                JOIN auth.scope s ON crs.scope_id = s.id
                JOIN auth.client c ON crs.client_id = c.id
                WHERE crs.role_id IN (SELECT role_id FROM all_user_roles)
                  AND c.client_id = $2
                  AND crs.granted = TRUE
            )
            SELECT 
                u.id as user_id, u.email, u.password_hash,
                (SELECT JSON_AGG(t) FROM selected_tenant t) as current_tenant,
                (SELECT JSON_AGG(t) FROM all_user_tenants t) as all_tenants,
                (SELECT JSON_AGG(r) FROM all_user_roles r) as all_roles,
                COALESCE((
                    SELECT ARRAY_AGG(DISTINCT value) FROM effective_permissions
                ), '{}') as permissions
            FROM user_info u;
        `;

        const res = await this.db.query(query, [email, clientId, schoolSlug || null]);
        const row = res.rows[0];
        if (!row) {
            console.log(`[UserHelper.getFullLoginContext] No user found for email: ${email}`);
            return null;
        }

        console.log(`[UserHelper.getFullLoginContext] User: ${email}, Client: ${clientId}, Slug: ${schoolSlug}`);
        console.log(`[UserHelper.getFullLoginContext] Roles detected:`, JSON.stringify(row.all_roles, null, 2));
        console.log(`[UserHelper.getFullLoginContext] Permissions (Final):`, JSON.stringify(row.permissions, null, 2));

        return {
            user_id: row.user_id,
            email: row.email,
            password: row.password_hash,
            tenant_id: row.current_tenant ? row.current_tenant[0].id : null,
            roles: row.all_roles || [],
            permissions: row.permissions || []
        };
    }

    /**
     * Optimized Identity Context fetcher for Token generation
     */
    public async getIdentityContext(email: string, clientId: string): Promise<any> {
        // Reuse the logic but without school_slug
        return this.getFullLoginContext(email, clientId);
    }
}

export default UserHelper;
