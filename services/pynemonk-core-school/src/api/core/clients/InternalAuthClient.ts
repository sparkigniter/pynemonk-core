import { injectable, inject } from "tsyringe";
import { IAuthClient, AuthUserResponse } from "../interfaces/IAuthClient.js";
import { Pool } from "pg";
import bcrypt from "bcrypt";

/**
 * Implementation of IAuthClient for the Monolith deployment.
 * It accesses the auth tables directly via the shared DB pool,
 * but encapsulates the logic so the rest of the school service stays clean.
 */
@injectable()
export class InternalAuthClient implements IAuthClient {
    constructor(@inject("DB") private db: Pool) { }

    public async createUser(
        data: {
            email: string;
            password?: string;
            role_slug: string;
            tenant_id: number;
        },
        db: Pool | any = this.db,
    ): Promise<AuthUserResponse> {
        const roleId = await this.getRoleId(data.tenant_id, data.role_slug, db);

        // 1. Create auth.user
        let userRes;
        try {
            userRes = await db.query(
                `INSERT INTO auth.user (tenant_id, email, role_id) VALUES ($1, $2, $3) RETURNING id, email, role_id`,
                [data.tenant_id, data.email, roleId],
            );
        } catch (error: any) {
            if (error.code === "23505" && error.constraint === "uq_user_email") {
                throw new Error("A user with this email already exists.");
            }
            throw error;
        }
        const userId = userRes.rows[0].id;

        // 2. Create auth.user_credential (if password provided)
        if (data.password) {
            const pwdHash = await bcrypt.hash(data.password, 12);
            await db.query(
                `INSERT INTO auth.user_credential (tenant_id, user_id, password_hash) VALUES ($1, $2, $3)`,
                [data.tenant_id, userId, pwdHash],
            );
        }

        // 3. Assign role in join table
        await db.query(
            `INSERT INTO auth.user_role (user_id, role_id, is_primary) VALUES ($1, $2, $3)`,
            [userId, roleId, true],
        );

        return userRes.rows[0];
    }

    public async getRoleId(
        tenantId: number,
        roleSlug: string,
        db: Pool | any = this.db,
    ): Promise<number> {
        const roleRes = await db.query(
            `SELECT id FROM auth.role WHERE tenant_id = $1 AND slug = $2 AND is_deleted = false`,
            [tenantId, roleSlug],
        );
        if (roleRes.rows.length === 0) {
            throw new Error(`Role '${roleSlug}' not found for this tenant`);
        }
        return roleRes.rows[0].id;
    }

    public async updateUser(
        userId: number,
        data: {
            email?: string;
            first_name?: string;
            last_name?: string;
        }
    ): Promise<void> {
        if (data.email) {
            await this.db.query(
                `UPDATE auth.user SET email = $1, updated_at = NOW() WHERE id = $2`,
                [data.email, userId]
            );
        }

        if (data.first_name || data.last_name) {
            await this.db.query(
                `INSERT INTO auth.user_profile (user_id, first_name, last_name, created_at, updated_at)
                 VALUES ($1, $2, $3, NOW(), NOW())
                 ON CONFLICT (user_id) DO UPDATE SET 
                    first_name = COALESCE(EXCLUDED.first_name, auth.user_profile.first_name),
                    last_name = COALESCE(EXCLUDED.last_name, auth.user_profile.last_name),
                    updated_at = NOW()`,
                [userId, data.first_name || null, data.last_name || null]
            );
        }
    }

    private async provisionDefaultRoles(tenantId: number, db: Pool | any): Promise<void> {
        // Fetch all templates
        const templates = await db.query(`SELECT slug, name, description, tier, is_system, data_scope FROM auth.role_template WHERE is_system = TRUE`);

        for (const template of templates.rows) {
            await db.query(
                `INSERT INTO auth.role
                    (tenant_id, slug, name, description, tier, is_system, data_scope, is_deleted, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, FALSE, NOW(), NOW())
                 ON CONFLICT (tenant_id, slug) WHERE (is_deleted = false) 
                 DO UPDATE SET 
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    tier = EXCLUDED.tier,
                    is_system = EXCLUDED.is_system,
                    data_scope = EXCLUDED.data_scope,
                    updated_at = NOW()`,
                [tenantId, template.slug, template.name, template.description, template.tier, template.is_system,
                    typeof template.data_scope === 'string' ? template.data_scope : JSON.stringify(template.data_scope || [])]
            );
        }
    }
}
