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
                user.tenant_id, 
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
            const { date, classroom_id, subject_id, records } = req.body;
            const user = (req as any).user;
            
            const result = await this.attendanceService.saveBulkAttendance(
                user.tenant_id,
                parseInt(user.sub),
                date,
                classroom_id,
                subject_id,
                records
            );

            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default AttendanceController;
