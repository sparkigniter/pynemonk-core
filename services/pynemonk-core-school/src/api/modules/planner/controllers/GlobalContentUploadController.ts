import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import BaseController from '../../../core/controllers/BaseController.js';
import { GlobalContentUploadService } from '../services/GlobalContentUploadService.js';

@injectable()
export class GlobalContentUploadController extends BaseController {
    constructor(private uploadService: GlobalContentUploadService) {
        super();
    }

    async uploadSyllabus(req: Request, res: Response) {
        try {
            if (!req.file) {
                return this.badrequest(res, "No file uploaded");
            }

            const boardName = req.body.board || 'CBSE';
            const gradeName = req.body.grade || 'Grade 1';
            const subjectName = req.body.subject || 'English';
            const academicYear = req.body.academicYear || '2026-2027';

            const result = await this.uploadService.uploadMasterSyllabus(
                boardName,
                gradeName,
                subjectName,
                academicYear,
                req.file.buffer
            );

            return this.ok(res, "Syllabus uploaded successfully", result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async uploadQuestionBank(req: Request, res: Response) {
        try {
            if (!req.file) {
                return this.badrequest(res, "No file uploaded");
            }

            const result = await this.uploadService.uploadQuestionBank(req.file.buffer);
            return this.ok(res, "Question Bank uploaded successfully", result);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
