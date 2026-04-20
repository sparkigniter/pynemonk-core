import { injectable, inject } from "tsyringe";
import { Pool } from "pg";

export interface RoleResponse {
    id: number;
    slug: string;
    name: string;
    description: string;
}

@injectable()
export default class RoleService {
    constructor(@inject("DB") private db: Pool) {}

    /**
     * Get all roles available for a tenant.
     */
    public async getAvailableRoles(tenantId: number): Promise<RoleResponse[]> {
        const res = await this.db.query(
            `SELECT id, slug, name, description 
             FROM auth.role 
             WHERE (tenant_id = $1 OR tenant_id IS NULL) 
             AND is_deleted = false 
             ORDER BY name ASC`,
            [tenantId]
        );
        return res.rows;
    }

    /**
     * Assign a role to a user.
     */
    public async assignRole(tenantId: number, userId: number, roleSlug: string): Promise<void> {
        // 1. Get role ID
        const roleRes = await this.db.query(
            `SELECT id FROM auth.role WHERE (tenant_id = $1 OR tenant_id IS NULL) AND slug = $2 AND is_deleted = false`,
            [tenantId, roleSlug]
        );

        if (roleRes.rows.length === 0) {
            throw new Error(`Role '${roleSlug}' not found.`);
        }

        const roleId = roleRes.rows[0].id;

        // 2. Assign role
        await this.db.query(
            `INSERT INTO auth.user_role (user_id, role_id, is_primary) 
             VALUES ($1, $2, false) 
             ON CONFLICT (user_id, role_id) DO UPDATE SET is_deleted = false`,
            [userId, roleId]
        );
    }

    /**
     * Remove a role from a user (soft delete).
     */
    public async removeRole(tenantId: number, userId: number, roleSlug: string): Promise<void> {
        const roleRes = await this.db.query(
            `SELECT id FROM auth.role WHERE (tenant_id = $1 OR tenant_id IS NULL) AND slug = $2`,
            [tenantId, roleSlug]
        );

        if (roleRes.rows.length > 0) {
            await this.db.query(
                `UPDATE auth.user_role SET is_deleted = true 
                 WHERE user_id = $1 AND role_id = $2`,
                [userId, roleRes.rows[0].id]
            );
        }
    }

    /**
     * Get all roles assigned to a user.
     */
    public async getUserRoles(tenantId: number, userId: number): Promise<RoleResponse[]> {
        const res = await this.db.query(
            `SELECT r.id, r.slug, r.name, r.description 
             FROM auth.role r
             JOIN auth.user_role ur ON r.id = ur.role_id
             WHERE ur.user_id = $1 AND ur.is_deleted = false`,
            [userId]
        );
        return res.rows;
    }
}
