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
        const roles = [
            // Tier 0 — Account Management
            {
                slug: 'owner', name: 'Account Owner', tier: 0,
                description: 'Registered the school. Manages billing and plan. No student data access by default.'
            },
            // Tier 1 — School Leadership
            {
                slug: 'principal', name: 'Principal', tier: 1,
                description: 'Head of school. Full academic, attendance, and disciplinary access.'
            },
            {
                slug: 'vice_principal', name: 'Vice Principal', tier: 1,
                description: 'Deputy head. Same scope as Principal by default.'
            },
            // Tier 2 — Administration
            {
                slug: 'school_admin', name: 'School Administrator', tier: 2,
                description: 'Office staff. Enrolment, timetables, user management. No grades or health data.'
            },
            {
                slug: 'accountant', name: 'Accountant / Fee Manager', tier: 2,
                description: 'Fee collection and financial reports only.'
            },
            // Tier 3 — Teaching
            {
                slug: 'teacher', name: 'Teacher', tier: 3,
                description: 'Subject teacher. Grades and attendance for own students only.'
            },
            {
                slug: 'class_teacher', name: 'Class Teacher', tier: 3,
                description: 'Homeroom teacher. Same as Teacher plus limited pastoral access for own class.'
            },
            // Tier 4 — External Portal
            {
                slug: 'student', name: 'Student', tier: 4,
                description: 'Enrolled student. Own grades, attendance, timetable, fee status.'
            },
            {
                slug: 'parent', name: 'Parent / Guardian', tier: 4,
                description: 'Parent portal. Linked child records only.'
            },
        ];

        const roleMap: Record<string, number> = {};
        for (const role of roles) {
            const res = await this.db.query(
                `INSERT INTO auth.role
                    (tenant_id, slug, name, description, tier, is_system, is_deleted, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, TRUE, FALSE, NOW(), NOW())
                 ON CONFLICT (tenant_id, name) WHERE (is_deleted = false) DO NOTHING
                 RETURNING id`,
                [tenantId, role.slug, role.name, role.description, role.tier]
            );
            if (res.rows[0]) {
                roleMap[role.slug] = res.rows[0].id;
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
}

export default TenantHelper;

