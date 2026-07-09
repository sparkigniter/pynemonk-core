import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import BaseController from '../../../core/controllers/BaseController.js';
import { ReportCardService } from '../services/ReportCardService.js';
import { ReportCardPDFService } from '../services/ReportCardPDFService.js';

@injectable()
export class ReportCardController extends BaseController {
    constructor(
        private reportCardService: ReportCardService,
        private pdfService: ReportCardPDFService
    ) {
        super();
    }

    /**
     * Get report card template settings
     */
    async getReportSettings(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const data = await this.reportCardService.getReportSettings(tenantId);
            return this.ok(res, "Report card settings retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    /**
     * Save report card template settings
     */
    async saveReportSettings(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const data = await this.reportCardService.saveReportSettings(tenantId, req.body);
            return this.ok(res, "Report card settings updated", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    /**
     * Download student report card PDF
     */
    async downloadStudentReportPDF(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const examId = parseInt(req.params.examId);
            const studentId = parseInt(req.params.studentId);
            
            const [reportData, settings] = await Promise.all([
                this.reportCardService.getReportCardData(tenantId, examId, studentId),
                this.reportCardService.getReportSettings(tenantId)
            ]);
            
            if (!reportData) {
                return this.notfound(res, "Report card data not found");
            }
            
            // Set headers for file download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=report_card_${studentId}.pdf`);
            
            // Generate PDF and stream directly to response
            this.pdfService.generate(reportData, settings, res);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
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
