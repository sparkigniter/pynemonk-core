import { injectable, inject } from "tsyringe";
import StaffHelper from "../helpers/StaffHelper.js";
import { IAuthClient } from "../../../core/interfaces/IAuthClient.js";

@injectable()
export default class StaffService {
    constructor(
        @inject(StaffHelper) private staffHelper: StaffHelper,
        @inject("IAuthClient") private authClient: IAuthClient,
    ) {}

    public async getStaffList(tenantId: number, filters: any = {}) {
        return this.staffHelper.findAll(tenantId, filters);
    }

    public async addStaff(tenantId: number, data: any) {
        // 1. Create identity in Auth service
        const authUser = await this.authClient.createUser({
            email: data.email,
            password: data.password,
            role_slug: data.role_slug || "teacher", // Default to teacher
            tenant_id: tenantId,
        });

        // 2. Create staff record in School service
        return this.staffHelper.create({ ...data, user_id: authUser.id, tenant_id: tenantId });
    }

    public async updateStaff(tenantId: number, id: number, data: any) {
        return this.staffHelper.update(tenantId, id, data);
    }

    public async removeStaff(tenantId: number, id: number) {
        return this.staffHelper.delete(tenantId, id);
    }

    public async getStaffById(tenantId: number, id: number) {
        return this.staffHelper.getStaffById(tenantId, id);
    }
}
