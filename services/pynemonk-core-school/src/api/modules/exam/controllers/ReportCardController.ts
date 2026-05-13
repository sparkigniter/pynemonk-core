import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import BaseController from '../../../core/controllers/BaseController.js';
import { ReportCardService } from '../services/ReportCardService.js';

@injectable()
export class ReportCardController extends BaseController {
    constructor(private reportCardService: ReportCardService) {
        super();
    }

    /**
     * Get a single student's report card
     */
    async getStudentReport(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const examId = parseInt(req.params.examId);
            const studentId = parseInt(req.params.studentId);
            
            const data = await this.reportCardService.getReportCardData(tenantId, examId, studentId);
            if (!data) return this.notfound(res, "Report card data not found");
            
            return this.ok(res, "Report card retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    /**
     * Get all report cards for a classroom
     */
    async getClassroomReports(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const examId = parseInt(req.params.examId);
            const classroomId = parseInt(req.params.classroomId);
            
            const data = await this.reportCardService.getClassroomReportCards(tenantId, examId, classroomId);
            return this.ok(res, "Classroom report cards retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
