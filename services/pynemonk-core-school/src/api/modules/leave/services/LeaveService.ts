import { injectable } from "tsyringe";
import LeaveHelper from "../helpers/LeaveHelper.js";

@injectable()
export default class LeaveService {
    constructor(private leaveHelper: LeaveHelper) {}

    public async applyLeave(tenantId: number, staffId: number, data: any) {
        return this.leaveHelper.createApplication({
            ...data,
            tenant_id: tenantId,
            staff_id: staffId
        });
    }

    public async getMyLeaves(tenantId: number, staffId: number) {
        return this.leaveHelper.getStaffApplications(tenantId, staffId);
    }

    public async getPendingLeaves(tenantId: number) {
        return this.leaveHelper.getPendingApplications(tenantId);
    }

    public async approveLeave(tenantId: number, applicationId: number, adminStaffId: number, remarks: string) {
        const app = await this.leaveHelper.getApplication(tenantId, applicationId);
        if (!app) throw new Error("Leave application not found");
        if (app.staff_id === adminStaffId) {
            throw new Error("You cannot approve your own leave application.");
        }
        return this.leaveHelper.updateStatus(tenantId, applicationId, {
            status: 'approved',
            approved_by: adminStaffId,
            remarks
        });
    }

    public async rejectLeave(tenantId: number, applicationId: number, adminStaffId: number, remarks: string) {
        const app = await this.leaveHelper.getApplication(tenantId, applicationId);
        if (!app) throw new Error("Leave application not found");
        if (app.staff_id === adminStaffId) {
            throw new Error("You cannot reject your own leave application.");
        }
        return this.leaveHelper.updateStatus(tenantId, applicationId, {
            status: 'rejected',
            approved_by: adminStaffId,
            remarks
        });
    }

    public async getLeaveTypes(tenantId: number) {
        return this.leaveHelper.getLeaveTypes(tenantId);
    }

    public async createLeaveType(tenantId: number, data: any) {
        return this.leaveHelper.createLeaveType({
            ...data,
            tenant_id: tenantId
        });
    }

    public async deleteLeaveType(tenantId: number, id: number) {
        return this.leaveHelper.deleteLeaveType(tenantId, id);
    }
}
