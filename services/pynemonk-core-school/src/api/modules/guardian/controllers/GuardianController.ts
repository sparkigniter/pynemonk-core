import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import GuardianHelper from "../helpers/GuardianHelper.js";

@injectable()
export default class GuardianController {
    constructor(
        @inject(GuardianHelper) private guardianHelper: GuardianHelper
    ) {}

    public async getMyStudents(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const students = await this.guardianHelper.getGuardianStudents(user.tenantId, user.userId);
            
            res.json({
                success: true,
                data: students
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    public async getStudentAttendance(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const studentId = parseInt(req.params.studentId);
            const attendance = await this.guardianHelper.getStudentAttendance(user.tenantId, studentId);
            res.json({ success: true, data: attendance });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    public async getStudentExams(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const studentId = parseInt(req.params.studentId);
            const exams = await this.guardianHelper.getStudentExams(user.tenantId, studentId);
            res.json({ success: true, data: exams });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    public async getStudentClassroomDetails(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const studentId = parseInt(req.params.studentId);
            const details = await this.guardianHelper.getStudentClassroomDetails(user.tenantId, studentId);
            res.json({ success: true, data: details });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
