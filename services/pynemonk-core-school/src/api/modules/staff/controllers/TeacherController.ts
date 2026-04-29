import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import TeacherHelper from "../helpers/TeacherHelper.js";

@injectable()
export default class TeacherController {
    constructor(
        @inject(TeacherHelper) private teacherHelper: TeacherHelper
    ) {}

    public async getDashboard(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const userId = parseInt(user.sub);
            const tenantId = parseInt(user.tenant_id);
            
            console.log(`[TeacherController] Fetching dashboard for UserID: ${userId}, TenantID: ${tenantId}`);
            
            const stats = await this.teacherHelper.getTeacherDashboardStats(userId, tenantId);
            const assignments = await this.teacherHelper.getTeacherAssignments(userId, tenantId);
            
            console.log(`[TeacherController] Found ${assignments.length} assignments for UserID: ${userId}`);
            
            res.json({
                success: true,
                data: {
                    stats,
                    assignments
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    public async getClassroomStudents(req: Request, res: Response): Promise<void> {
        try {
            const classroomId = parseInt(req.params.classroomId);
            const students = await this.teacherHelper.getClassroomStudents(classroomId);
            res.json({ success: true, data: students });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    public async getTimetable(req: Request, res: Response): Promise<void> {
        try {
            const userId = parseInt((req as any).user.sub);
            const timetable = await this.teacherHelper.getTeacherTimetable(userId);
            res.json({ success: true, data: timetable });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    public async getExams(req: Request, res: Response): Promise<void> {
        try {
            const userId = parseInt((req as any).user.sub);
            const exams = await this.teacherHelper.getTeacherExams(userId);
            res.json({ success: true, data: exams });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
