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
    public async getEffectivePermissions(userId: number, tenant_id?: number): Promise<string[]> {
        const query = `
            -- 1. Relational Scopes from Role-Scope Assignment (Preferred)
            SELECT DISTINCT s.value as key
            FROM auth.scope s
            JOIN auth.role_scope rs ON s.id = rs.scope_id
            LEFT JOIN auth.user_role ur ON rs.role_id = ur.role_id AND ur.is_deleted = FALSE
            LEFT JOIN auth.user u ON rs.role_id = u.role_id AND u.is_deleted = FALSE
            WHERE (ur.user_id = $1 OR u.id = $1)
              AND rs.granted = TRUE
              AND (rs.tenant_id = $2 OR rs.tenant_id IS NULL)

            UNION

            -- 2. Legacy Relational Permissions from Join Table
            SELECT DISTINCT p.key
            FROM auth.permission p
            JOIN auth.role_permission rp ON p.id = rp.permission_id
            LEFT JOIN auth.user_role ur ON rp.role_id = ur.role_id AND ur.is_deleted = FALSE
            LEFT JOIN auth.user u ON rp.role_id = u.role_id AND u.is_deleted = FALSE
            WHERE (ur.user_id = $1 OR u.id = $1)
              AND rp.granted = TRUE
              AND (rp.tenant_id = $2 OR rp.tenant_id IS NULL)

            UNION

            -- 3. Legacy/Cache Permissions from JSONB (data_scope)
            SELECT DISTINCT jsonb_array_elements_text(r.data_scope) as key
            FROM auth.role r
            LEFT JOIN auth.user_role ur ON r.id = ur.role_id AND ur.is_deleted = FALSE
            LEFT JOIN auth.user u ON r.id = u.role_id AND u.is_deleted = FALSE
            WHERE (ur.user_id = $1 OR u.id = $1)
              AND (r.tenant_id = $2 OR r.tenant_id IS NULL)
        `;

        const res = await this.db.query(query, [userId, tenant_id ?? null]);
        return res.rows.map((r: { key: string }) => r.key);
    }
}

export default UserHelper;
