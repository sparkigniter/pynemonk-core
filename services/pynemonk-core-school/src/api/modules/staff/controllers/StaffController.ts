import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import StaffService from "../services/StaffService.js";
import ResourceController from "../../../core/controllers/ResourceController.js";
import { AccessLevel } from "../../../core/helpers/DataScopeHelper.js";

@injectable()
export default class StaffController extends ResourceController {
    constructor(@inject(StaffService) private staffService: StaffService) {
        super();
    }

    public async list(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const scope = await this.getScope(req);
            const user = (req as any).user;
            const { page, limit, search, status, gender, designation, blood_group, religion, nationality } = req.query;
            const filters: any = {
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10,
                search: search as string,
                status: status as string,
                gender: gender as string,
                designation: designation as string,
                blood_group: blood_group as string,
                religion: religion as string,
                nationality: nationality as string,
            };

            const canReadFull = user.permissions.includes('staff:read') || scope.accessLevel === AccessLevel.FULL;
            const canReadDirectory = user.permissions.includes('staff.directory:read');

            // If user doesn't have full read but has directory read, allow seeing all but sanitized
            if (!canReadFull && !canReadDirectory) {
                filters.ids = scope.staffIds;
            }

            const result = await this.staffService.getStaffList(tenantId, filters);
            
            // Sanitize if not full access
            if (!canReadFull) {
                result.data = result.data.map((s: any) => this.sanitizeStaff(s));
            }

            return this.ok(res, "Staff list retrieved", result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async get(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const scope = await this.getScope(req);
            const user = (req as any).user;

            const canReadFull = user.permissions.includes('staff:read') || scope.accessLevel === AccessLevel.FULL;
            const canReadDirectory = user.permissions.includes('staff.directory:read');

            if (!canReadFull && !canReadDirectory && !scope.hasStaff(id)) {
                return this.forbidden(res, "You do not have access to this staff member's profile");
            }

            const staff = await this.staffService.getStaffById(tenantId, id);
            if (!staff) return this.notfound(res, "Staff not found");

            return this.ok(res, "Staff details retrieved", canReadFull ? staff : this.sanitizeStaff(staff));
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    /**
     * Strips sensitive PII from staff record for public directory view.
     */
    private sanitizeStaff(staff: any) {
        const {
            aadhaar_number,
            pan_number,
            bank_account_no,
            bank_name,
            ifsc_code,
            address,
            phone,
            date_of_birth,
            emergency_contact_phone,
            marital_status,
            religion,
            nationality,
            ...sanitized
        } = staff;
        return sanitized;
    }

    public async create(req: Request, res: Response) {
        try {
            const scope = await this.getScope(req);
            if (scope.accessLevel !== AccessLevel.FULL) {
                return this.forbidden(res, "Only administrators can add staff members");
            }

            const tenantId = this.getTenantId(req);
            const staff = await this.staffService.addStaff(tenantId, req.body);
            return this.ok(res, "Staff created successfully", staff);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const scope = await this.getScope(req);

            if (!scope.hasStaff(id) && scope.accessLevel !== AccessLevel.FULL) {
                return this.forbidden(res, "You do not have permission to update this staff profile");
            }

            const staff = await this.staffService.updateStaff(tenantId, id, req.body);
            return this.ok(res, "Staff updated successfully", staff);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            const scope = await this.getScope(req);
            if (scope.accessLevel !== AccessLevel.FULL) {
                return this.forbidden(res, "Only administrators can delete staff members");
            }

            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            await this.staffService.removeStaff(tenantId, id);
            return this.ok(res, "Staff deleted successfully");
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async getMe(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const userId = (req as any).user.userId;
            const staff = await this.staffService.getStaffByUserId(tenantId, parseInt(userId));
            if (!staff) return this.notfound(res, "Staff profile not found");
            return this.ok(res, "Profile retrieved", staff);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
