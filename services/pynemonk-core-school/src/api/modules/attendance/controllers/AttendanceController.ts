import { Request, Response } from "express";
import { injectable } from "tsyringe";
import AttendanceService from "../services/AttendanceService.js";

@injectable()
export class AttendanceController {
    constructor(private attendanceService: AttendanceService) { }

    public async getRoster(req: Request, res: Response) {
        try {
            const { classroomId } = req.params;
            const date = req.query.date as string || new Date().toISOString().split('T')[0];
            const user = (req as any).user;

            const roster = await this.attendanceService.getClassroomRoster(
                user.tenantId, 
                parseInt(classroomId), 
                date
            );

            res.status(200).json({ success: true, data: roster });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    public async saveAttendance(req: Request, res: Response) {
        try {
            const { date, records } = req.body;
            const user = (req as any).user;
            
            // In a real scenario, we'd find the staff_id linked to the user.userId
            // For now, we'll use a placeholder or look it up if needed.
            // We'll assume the frontend might send staffId or we fetch it here.
            
            const result = await this.attendanceService.saveBulkAttendance(
                user.tenantId,
                user.userId, // Using userId as staffId for now, ideally should be mapped
                date,
                records
            );

            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default AttendanceController;
