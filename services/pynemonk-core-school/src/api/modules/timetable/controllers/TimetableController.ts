import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { TimetableService } from "../services/TimetableService.js";

@injectable()
export class TimetableController {
    constructor(private timetableService: TimetableService) {}

    async getByClassroom(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const classroomId = parseInt(req.params.classroomId);
            const data = await this.timetableService.getByClassroom(tenantId, classroomId);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const entry = { ...req.body, tenant_id: tenantId };
            const data = await this.timetableService.createEntry(entry);
            res.status(201).json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const id = parseInt(req.params.id);
            const entry = { ...req.body, tenant_id: tenantId };
            const data = await this.timetableService.updateEntry(id, entry);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const id = parseInt(req.params.id);
            await this.timetableService.deleteEntry(tenantId, id);
            res.json({ success: true, message: "Entry deleted" });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getSuggestions(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const teacherId = parseInt(req.query.teacher_id as string);
            const classroomId = parseInt(req.query.classroom_id as string);
            const day = parseInt(req.query.day as string);
            const data = await this.timetableService.getAvailableSlots(tenantId, teacherId, classroomId, day);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getTeacherSchedule(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenant_id;
            const teacherId = parseInt(req.query.teacher_id as string);
            const day = parseInt(req.query.day as string);
            const data = await this.timetableService.getTeacherSchedule(tenantId, teacherId, day);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
