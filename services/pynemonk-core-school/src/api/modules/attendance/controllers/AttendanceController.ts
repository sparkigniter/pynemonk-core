import { Request, Response } from "express";
import { injectable } from "tsyringe";
import AttendanceService from "../services/AttendanceService.js";
import ResourceController from "../../../core/controllers/ResourceController.js";

@injectable()
export class AttendanceController extends ResourceController {
    constructor(private attendanceService: AttendanceService) { 
        super();
    }

    public async getRoster(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.classroomId);
            const date = req.query.date as string || new Date().toISOString().split('T')[0];
            const user = (req as any).user;
            const scope = await this.getScope(req);

            if (!scope.hasClassroom(id)) {
                return this.forbidden(res, "You do not have access to this classroom's roster");
            }

            const roster = await this.attendanceService.getClassroomRoster(
                user.tenantId, 
                id, 
                date
            );

            return this.ok(res, "Roster retrieved", roster);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    public async saveAttendance(req: Request, res: Response) {
        try {
            const { date, classroom_id, subject_id, records } = req.body;
            const user = (req as any).user;
            const scope = await this.getScope(req);

            if (!scope.hasClassroom(parseInt(classroom_id))) {
                return this.forbidden(res, "You do not have permission to record attendance for this classroom");
            }
            
            const result = await this.attendanceService.saveBulkAttendance(
                user.tenantId,
                user.userId,
                date,
                parseInt(classroom_id),
                subject_id,
                records
            );

            return this.ok(res, "Attendance saved successfully", result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}

export default AttendanceController;
