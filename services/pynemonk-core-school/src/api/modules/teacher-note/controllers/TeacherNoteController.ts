import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { TeacherNoteService } from "../services/TeacherNoteService.js";
import BaseController from "../../../core/controllers/BaseController.js";

@injectable()
export class TeacherNoteController extends BaseController {
    constructor(private noteService: TeacherNoteService) {
        super();
    }

    async listNotes(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;
            const filters = {
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
                classroomId: req.query.classroomId ? parseInt(req.query.classroomId as string) : undefined,
                subjectId: req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined,
            };

            const notes = await this.noteService.listNotes(tenantId, userId, filters);
            return this.ok(res, "Notes retrieved", notes);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async createNote(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;
            const note = await this.noteService.createNote(tenantId, userId, req.body);
            return this.ok(res, "Note created", note);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async updateNote(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const userId = (req as any).user.userId;
            const noteId = parseInt(req.params.id);
            const note = await this.noteService.updateNote(tenantId, userId, noteId, req.body);
            return this.ok(res, "Note updated", note);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
