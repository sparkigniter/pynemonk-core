import "reflect-metadata";
import bcrypt from "bcrypt";
import { injectable, inject } from "tsyringe";
import TenantHelper from "../helpers/TenantHelper.js";
import TenantValidator from "../validator/TenantValidator.js";
import ValidationError from "../../../errors/ValidationError.js";

/** Generates a URL-friendly slug from a school name */
function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

@injectable()
class TenantService {

    constructor(@inject(TenantHelper) private tenantHelper: TenantHelper, @inject(TenantValidator) private tenantValidator: TenantValidator, ) {}

    /** Return all active packages */
    public async getPackages(): Promise<any[]> {
        return this.tenantHelper.getPackages();
    }

    /** Step 1: Register a new school tenant and provision its roles */
    public async registerTenant(data: {
        name: string;
        school_id?: string;
        email: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        package_id: number;
        academic_year?: { name: string; start_date: string; end_date: string };
        settings?: { language: string; date_format: string };
    }): Promise<any> {
        await this.tenantValidator.validate(data);

        const existingTenant = await this.tenantHelper.getTenantByEmail(data.email);
        if (existingTenant) {
            const hasOwner = await this.tenantHelper.hasOwner(existingTenant.id);
            if (hasOwner) {
                throw new ValidationError("A school with this email is already fully registered. Please log in.");
            }
            await this.tenantHelper.createDefaultRoles(existingTenant.id);
            return existingTenant;
        }

        const slug = data.school_id ? slugify(data.school_id) : slugify(data.name);

        // Check if slug is unique
        const exists = await this.tenantHelper.tenantExists(slug, data.email);
        if (exists) {
            throw new ValidationError("This School ID is already taken. Please choose another one.");
        }

        // Create tenant
        const tenant = await this.tenantHelper.createTenant({ ...data, slug });

        // Seed all system roles for this tenant
        await this.tenantHelper.createDefaultRoles(tenant.id);

        // Seed the specified academic year
        await this.tenantHelper.provisionAcademicYear(tenant.id, data.academic_year);

        return tenant;
    }

    /**
     * Step 2: Create the owner account for an already-registered tenant.
     * Only succeeds if no owner user exists yet (one-time setup guard).
     */
    public async setupOwner(
        tenantId: number,
        data: { admin_email: string; admin_password: string }
    ): Promise<any> {
        await this.tenantValidator.validateOwner(data);

        // Guard: owner can only be set up once
        const alreadySetup = await this.tenantHelper.hasOwner(tenantId);
        if (alreadySetup) {
            throw new ValidationError(
                "An owner account already exists for this school"
            );
        }

        const roleMap = await this.tenantHelper.getRoleMap(tenantId);
        if (!roleMap['owner']) {
            throw new ValidationError("Role provisioning incomplete. Please contact support.");
        }

        const passwordHash = await bcrypt.hash(data.admin_password, 12);
        const owner = await this.tenantHelper.createAdminUser(
            tenantId,
            roleMap['owner'],
            data.admin_email,
            passwordHash,
        );

        return { id: owner.id, email: owner.email };
    }

    /** Get tenant details by id */
    public async getTenantById(id: number): Promise<any> {
        const tenant = await this.tenantHelper.getTenantById(id);
        if (!tenant) throw new ValidationError("Tenant not found");
        return tenant;
    }

    /** List all registered tenants */
    public async getAllTenants(): Promise<any[]> {
        return this.tenantHelper.getAllTenants();
    }
}

export default TenantService;
