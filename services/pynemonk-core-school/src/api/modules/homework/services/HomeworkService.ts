import { injectable } from "tsyringe";
import { HomeworkHelper, type Homework } from "../helpers/HomeworkHelper.js";
import StaffHelper from "../../staff/helpers/StaffHelper.js";

@injectable()
export class HomeworkService {
    constructor(
        private homeworkHelper: HomeworkHelper,
        private staffHelper: StaffHelper
    ) {}

    private async getStaffId(tenantId: number, userId: number) {
        const staff = await this.staffHelper.findByUserId(tenantId, userId);
        if (!staff) throw new Error("Staff record not found for user. Please ensure you are registered as a staff member.");
        return staff.id;
    }

    async getHomeworkById(tenantId: number, userId: number, id: number) {
        const homework = await this.homeworkHelper.findById(tenantId, id);
        if (!homework) throw new Error("Homework not found");
        return homework;
    }

    async listHomework(tenantId: number, userId: number, filters: any) {
        // Teachers only see their own homework by default, unless they are admins
        // For now, let's just pass filters. 
        // If staffId is not provided, we can default to the current teacher's ID
        return this.homeworkHelper.listHomework(tenantId, filters);
    }

    async createHomework(tenantId: number, userId: number, data: Partial<Homework>) {
        const staffId = await this.getStaffId(tenantId, userId);
        return this.homeworkHelper.createHomework(tenantId, { ...data, staff_id: staffId });
    }

    async updateHomework(tenantId: number, userId: number, id: number, data: Partial<Homework>) {
        const staffId = await this.getStaffId(tenantId, userId);
        // Verify ownership
        const homework = await this.homeworkHelper.findById(tenantId, id);
        if (!homework) throw new Error("Homework not found");
        if (homework.staff_id !== staffId) throw new Error("Unauthorized: You can only update your own homework");

        return this.homeworkHelper.updateHomework(tenantId, id, data);
    }

    async deleteHomework(tenantId: number, userId: number, id: number) {
        const staffId = await this.getStaffId(tenantId, userId);
        const homework = await this.homeworkHelper.findById(tenantId, id);
        if (!homework) throw new Error("Homework not found");
        if (homework.staff_id !== staffId) throw new Error("Unauthorized: You can only delete your own homework");

        return this.homeworkHelper.updateHomework(tenantId, id, { is_deleted: true });
    }
}
