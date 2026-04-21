import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import { Pool } from "pg";

@injectable()
class TenantHelper {
    constructor(@inject("DB") private db: Pool) { }

    /** Fetch all active packages */
    public async getPackages(): Promise<any[]> {
        const res = await this.db.query(
            `SELECT id, name, slug, description, price_usd, features
             FROM auth.package
             WHERE is_active = TRUE
             ORDER BY price_usd ASC`
        );
        return res.rows;
    }

    /** Register a new tenant (school) */
    public async createTenant(data: {
        name: string;
        slug: string;
        email: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        package_id: number;
    }): Promise<any> {
        const res = await this.db.query(
            `INSERT INTO auth.tenant
                (name, slug, email, phone, address, city, state, country, package_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             RETURNING id, uuid, name, slug, email, phone, address, city, state, country, package_id, is_active, created_at`,
            [
                data.name,
                data.slug,
                data.email,
                data.phone ?? null,
                data.address ?? null,
                data.city ?? null,
                data.state ?? null,
                data.country ?? null,
                data.package_id,
            ]
        );
        return res.rows[0];
    }

    /** Check if a slug or email is already taken */
    public async tenantExists(slug: string, email: string): Promise<boolean> {
        const res = await this.db.query(
            `SELECT id FROM auth.tenant WHERE slug = $1 OR email = $2 LIMIT 1`,
            [slug, email]
        );
        return res.rows.length > 0;
    }
    /** Get tenant by email */
    public async getTenantByEmail(email: string): Promise<any> {
        const res = await this.db.query(
            `SELECT * FROM auth.tenant WHERE email = $1 AND is_deleted = FALSE`,
            [email]
        );
        return res.rows[0] ?? null;
    }

    /** Get tenant by id */
    public async getTenantById(id: number): Promise<any> {
        const res = await this.db.query(
            `SELECT t.*, p.name AS package_name, p.slug AS package_slug, p.price_usd
             FROM auth.tenant t
             JOIN auth.package p ON p.id = t.package_id
             WHERE t.id = $1 AND t.is_deleted = FALSE`,
            [id]
        );
        return res.rows[0] ?? null;
    }

    /**
     * Seeds the default system roles for a new tenant.
     * Only is_system=TRUE roles are auto-provisioned.
     * Optional roles (librarian, counselor, nurse, hr, receptionist)
     * can be added later by the school admin.
     * Returns a map of { slug → role_id } for immediate use.
     */
    public async createDefaultRoles(tenantId: number): Promise<Record<string, number>> {
        // Fetch all system roles from the template catalogue
        const templatesRes = await this.db.query(
            `SELECT slug, name, description, tier, is_system, data_scope 
             FROM auth.role_template 
             WHERE is_system = TRUE`
        );
        const templates = templatesRes.rows;

        const roleMap: Record<string, number> = {};
        for (const template of templates) {
            // Use an UPSERT that targets the slug unique index
            const res = await this.db.query(
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
                    updated_at = NOW()
                 RETURNING id`,
                [tenantId, template.slug, template.name, template.description, template.tier, template.is_system, 
                 typeof template.data_scope === 'string' ? template.data_scope : JSON.stringify(template.data_scope || [])]
            );
            
            if (res.rows[0]) {
                roleMap[template.slug] = res.rows[0].id;
            }
        }
        return roleMap;
    }

    /**
     * Creates the admin user account + hashed credential for a new tenant.
     * Returns the created user record.
     */
    public async createAdminUser(
        tenantId: number,
        roleId: number,
        email: string,
        passwordHash: string,
    ): Promise<any> {
        // Create user
        const userRes = await this.db.query(
            `INSERT INTO auth.user (tenant_id, email, role_id, is_deleted, created_at, updated_at)
             VALUES ($1, $2, $3, false, NOW(), NOW())
             RETURNING id, email, role_id, created_at`,
            [tenantId, email, roleId]
        );
        const user = userRes.rows[0];
        
        // Assign role in the join table for multi-tenant discovery
        await this.db.query(
            `INSERT INTO auth.user_role (user_id, role_id, is_primary)
             VALUES ($1, $2, TRUE)`,
            [user.id, roleId]
        );

        // Create credential (no profile — admin is not the principal)
        await this.db.query(
            `INSERT INTO auth.user_credential (tenant_id, user_id, password_hash, is_deleted, created_at, updated_at)
             VALUES ($1, $2, $3, false, NOW(), NOW())`,
            [tenantId, user.id, passwordHash]
        );

        return user;
    }
    /** Check if an owner user already exists for this tenant */
    public async hasOwner(tenantId: number): Promise<boolean> {
        const res = await this.db.query(
            `SELECT u.id
             FROM auth.user u
             JOIN auth.role r ON r.id = u.role_id
             WHERE u.tenant_id = $1
               AND r.slug = 'owner'
               AND u.is_deleted = FALSE
             LIMIT 1`,
            [tenantId]
        );
        return res.rows.length > 0;
    }

    /** Return { slug → role_id } map for an existing tenant */
    public async getRoleMap(tenantId: number): Promise<Record<string, number>> {
        const res = await this.db.query(
            `SELECT slug, id FROM auth.role
             WHERE tenant_id = $1 AND is_deleted = FALSE`,
            [tenantId]
        );
        const map: Record<string, number> = {};
        for (const row of res.rows) {
            map[row.slug] = row.id;
        }
        return map;
    }

    /**
     * Seeds a default current academic year for a new tenant.
     * This avoids "No current academic year found" errors.
     */
    public async provisionAcademicYear(tenantId: number, data?: { name: string; start_date: string; end_date: string }): Promise<void> {
        const yearName = data?.name || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        const startDate = data?.start_date || `${new Date().getFullYear()}-01-01`;
        const endDate = data?.end_date || `${new Date().getFullYear()}-12-31`;

        await this.db.query(
            `INSERT INTO school.academic_year 
                (tenant_id, name, start_date, end_date, is_current, status)
             VALUES ($1, $2, $3, $4, TRUE, 'active')
             ON CONFLICT (tenant_id, name) WHERE (is_deleted = false) DO NOTHING`,
            [tenantId, yearName, startDate, endDate]
        );
    }
}

export default TenantHelper;

