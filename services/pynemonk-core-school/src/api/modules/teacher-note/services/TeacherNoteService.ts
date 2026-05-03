import { injectable } from "tsyringe";
import { TeacherNoteHelper, type TeacherNote } from "../helpers/TeacherNoteHelper.js";
import StaffHelper from "../../staff/helpers/StaffHelper.js";

@injectable()
export class TeacherNoteService {
    constructor(
        private noteHelper: TeacherNoteHelper,
        private staffHelper: StaffHelper
    ) {}

    private async getStaffId(tenantId: number, userId: number) {
        const staff = await this.staffHelper.findByUserId(tenantId, userId);
        if (!staff) throw new Error("Staff record not found for user. Please ensure you are registered as a staff member.");
        return staff.id;
    }

    async listNotes(tenantId: number, userId: number, filters: any) {
        const staff = await this.staffHelper.findByUserId(tenantId, userId);
        if (!staff) return [];
        return this.noteHelper.listNotes(tenantId, staff.id, filters);
    }

    async createNote(tenantId: number, userId: number, data: Partial<TeacherNote>) {
        const staffId = await this.getStaffId(tenantId, userId);
        return this.noteHelper.createNote(tenantId, staffId, data);
    }

    async updateNote(tenantId: number, userId: number, noteId: number, data: Partial<TeacherNote>) {
        const staffId = await this.getStaffId(tenantId, userId);
        return this.noteHelper.updateNote(tenantId, staffId, noteId, data);
    }
}
