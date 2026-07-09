import { Response } from "express";
import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import ReportService from "../services/ReportService.js";
import Exporters from "../helpers/Exporters.js";
import { AuthenticatedRequest } from "../../../core/middleware/requireAuth.js";

@injectable()
export default class ReportController {
    constructor(
        @inject("DB") private db: Pool,
        @inject(ReportService) private reportService: ReportService,
        @inject(Exporters) private exporters: Exporters
    ) {}

    /**
     * Helper to return standard JSON error response
     */
    private error(res: Response, status: number, message: string, detail?: string) {
        return res.status(status).json({
            success: false,
            message,
            ...(detail ? { detail } : {})
        });
    }

    /**
     * Helper to return standard JSON success response
     */
    private success(res: Response, message: string, data?: any) {
        return res.status(200).json({
            success: true,
            message,
            ...(data !== undefined ? { data } : {})
        });
    }

    /**
     * Synchronous Report Generation Endpoint.
     * GET /reports/generate/:type
     */
    public generateSync = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const reportType = req.params.type;
            const format = (req.query.format as string || "json").toLowerCase();

            // Extract filters from query parameters
            const filters: any = {
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
                fiscalYearId: req.query.fiscalYearId ? Number(req.query.fiscalYearId) : undefined,
                showZeroBalance: req.query.showZeroBalance === "true",
                gradeId: req.query.gradeId ? Number(req.query.gradeId) : undefined,
                classroomId: req.query.classroomId ? Number(req.query.classroomId) : undefined,
                examId: req.query.examId ? Number(req.query.examId) : undefined,
                studentId: req.query.studentId ? Number(req.query.studentId) : undefined,
                status: req.query.status as string,
                sourceType: req.query.sourceType as string,
                fromPartnerId: req.query.fromPartnerId ? Number(req.query.fromPartnerId) : undefined,
                toPartnerId: req.query.toPartnerId ? Number(req.query.toPartnerId) : undefined,
                subType: req.query.subType as string
            };

            // Fetch Tenant Name for PDF Context
            const tenantRes = await this.db.query("SELECT name FROM auth.tenant WHERE id = $1", [tenantId]);
            const tenantName = tenantRes.rows[0]?.name || "Luvia Institutional";

            console.log(`[ReportController] Sync request for tenant ${tenantId}, type ${reportType}, format ${format}`);

            // 1. Query raw report data
            let rawData: any;
            if (reportType === "trial_balance") {
                rawData = await this.reportService.getTrialBalance(tenantId, filters);
            } else if (reportType === "profit_loss") {
                rawData = await this.reportService.getProfitAndLoss(tenantId, filters);
            } else if (reportType === "balance_sheet") {
                rawData = await this.reportService.getBalanceSheet(tenantId, filters);
            } else if (reportType === "cash_flow") {
                rawData = await this.reportService.getCashFlow(tenantId, filters);
            } else if (reportType === "aging") {
                if (filters.subType === "ap") {
                    rawData = await this.reportService.getAPAgingReport(tenantId);
                } else {
                    rawData = await this.reportService.getARAgingReport(tenantId, filters);
                }
            } else if (reportType === "student_grades") {
                rawData = await this.reportService.getStudentGrades(tenantId, filters);
            } else if (reportType === "summary") {
                rawData = await this.reportService.getSummary(tenantId);
            } else if (reportType === "trends") {
                rawData = await this.reportService.getFinancialTrends(tenantId);
            } else {
                return this.error(res, 400, `Unsupported report type: ${reportType}`);
            }

            // Return JSON directly if format matches
            if (format === "json") {
                return this.success(res, `${reportType} retrieved`, rawData);
            }

            // 2. Format data for exporter
            const exportData = this.reportService.prepareExportData(reportType, rawData, filters.subType);

            // 3. Export to target format
            if (format === "csv") {
                const csvString = this.exporters.generateCSV(exportData.items, exportData.columns);
                res.setHeader("Content-Type", "text/csv");
                res.setHeader("Content-Disposition", `attachment; filename=${reportType}_${new Date().toISOString().split("T")[0]}.csv`);
                return res.send(csvString);
            } else if (format === "xlsx") {
                const excelBuffer = this.exporters.generateExcel(exportData.items, exportData.columns);
                res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                res.setHeader("Content-Disposition", `attachment; filename=${reportType}_${new Date().toISOString().split("T")[0]}.xlsx`);
                return res.send(excelBuffer);
            } else if (format === "pdf") {
                // Fetch customizable templates
                const templates = await this.reportService.getReportTemplates(tenantId, reportType);
                const template = templates.find((t) => t.is_default) || templates[0];
                
                if (!template) {
                    return this.error(res, 400, `No default template found for report type '${reportType}'. Please create one in Designer.`);
                }

                const pdfBuffer = await this.exporters.generatePDF(
                    exportData,
                    template.template_html,
                    template.template_css,
                    tenantName
                );

                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Length", pdfBuffer.length);
                res.setHeader("Content-Disposition", `attachment; filename=${reportType}_${new Date().toISOString().split("T")[0]}.pdf`);
                return res.end(pdfBuffer, "binary");
            } else {
                return this.error(res, 400, `Unsupported format: ${format}`);
            }

        } catch (error: any) {
            console.error("[ReportController:generateSync] Error:", error);
            return this.error(res, 500, "Failed to generate report synchronously", error.message);
        }
    };

    /**
     * Trigger offline background generation task.
     * POST /reports/jobs
     */
    public triggerJob = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const userId = req.user!.userId;
            const { reportType, format, filters, password, emailDispatch } = req.body;

            if (!reportType || !format) {
                return this.error(res, 400, "Missing required parameters: reportType and format");
            }

            const query = `
                INSERT INTO reports.job (tenant_id, user_id, report_type, format, filters, password, email_dispatch, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
                RETURNING id, status, created_at
            `;
            const result = await this.db.query(query, [
                tenantId,
                userId,
                reportType,
                format.toLowerCase(),
                filters || {},
                password || null,
                emailDispatch || null
            ]);

            const job = result.rows[0];
            return res.status(202).json({
                success: true,
                message: "Asynchronous report generation job successfully queued.",
                data: {
                    jobId: job.id,
                    status: job.status,
                    createdAt: job.created_at
                }
            });

        } catch (error: any) {
            console.error("[ReportController:triggerJob] Error:", error);
            return this.error(res, 500, "Failed to queue asynchronous report job", error.message);
        }
    };

    /**
     * List all offline reports jobs.
     * GET /reports/jobs
     */
    public getJobsList = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const query = `
                SELECT id, report_type, format, filters, status, error_message, created_at, updated_at
                FROM reports.job
                WHERE tenant_id = $1
                ORDER BY created_at DESC
                LIMIT 50
            `;
            const result = await this.db.query(query, [tenantId]);
            return this.success(res, "Offline jobs list retrieved", result.rows);
        } catch (error: any) {
            console.error("[ReportController:getJobsList] Error:", error);
            return this.error(res, 500, "Failed to retrieve offline jobs list", error.message);
        }
    };

    /**
     * Fetch status of specific offline job.
     * GET /reports/jobs/:id
     */
    public getJobStatus = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const jobId = Number(req.params.id);

            const query = `
                SELECT id, report_type, format, filters, status, error_message, created_at, updated_at,
                       (CASE WHEN status = 'COMPLETED' THEN TRUE ELSE FALSE END) as is_ready
                FROM reports.job
                WHERE id = $1 AND tenant_id = $2
            `;
            const result = await this.db.query(query, [jobId, tenantId]);
            if (result.rows.length === 0) {
                return this.error(res, 404, "Report job not found");
            }

            return this.success(res, "Report job retrieved", result.rows[0]);
        } catch (error: any) {
            console.error("[ReportController:getJobStatus] Error:", error);
            return this.error(res, 500, "Failed to retrieve job status", error.message);
        }
    };

    /**
     * Securely download completed offline report.
     * GET /reports/jobs/:id/download
     */
    public downloadJobOutput = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const jobId = Number(req.params.id);

            const query = `
                SELECT file_path, status, format, report_type, password
                FROM reports.job
                WHERE id = $1 AND tenant_id = $2
            `;
            const result = await this.db.query(query, [jobId, tenantId]);
            if (result.rows.length === 0) {
                return this.error(res, 404, "Report job not found");
            }

            const job = result.rows[0];
            if (job.status !== "COMPLETED") {
                return this.error(res, 400, `Report is not ready. Current status: ${job.status}`);
            }

            const filePath = job.file_path;
            if (!filePath || !fs.existsSync(filePath)) {
                return this.error(res, 404, "Report output file not found on server storage");
            }

            const ext = path.extname(filePath);
            const downloadName = `${job.report_type}_job_${jobId}${ext}`;

            console.log(`[ReportController] Securing download for job ${jobId}. Sending file: ${filePath}`);
            
            res.setHeader("Content-Disposition", `attachment; filename=${downloadName}`);
            
            if (ext === ".zip") {
                res.setHeader("Content-Type", "application/zip");
            } else if (ext === ".pdf") {
                res.setHeader("Content-Type", "application/pdf");
            } else if (ext === ".csv") {
                res.setHeader("Content-Type", "text/csv");
            } else if (ext === ".xlsx") {
                res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            }

            return res.download(filePath, downloadName);

        } catch (error: any) {
            console.error("[ReportController:downloadJobOutput] Error:", error);
            return this.error(res, 500, "Failed to secure download report output", error.message);
        }
    };

    /**
     * Get templates list.
     * GET /reports/templates
     */
    public getTemplates = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const reportType = req.query.reportType as string;

            const templates = await this.reportService.getReportTemplates(tenantId, reportType);
            return this.success(res, "Report templates retrieved", templates);
        } catch (error: any) {
            console.error("[ReportController:getTemplates] Error:", error);
            return this.error(res, 500, "Failed to retrieve report templates", error.message);
        }
    };

    /**
     * Create or edit a template.
     * POST /reports/templates
     */
    public saveTemplate = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const tenantId = req.user!.tenantId;
            const { name, reportType, html, css, settings, isDefault } = req.body;

            if (!name || !reportType || !html) {
                return this.error(res, 400, "Missing required parameters: name, reportType, and html");
            }

            const template = await this.reportService.upsertReportTemplate(tenantId, {
                name,
                reportType,
                templateHtml: html,
                templateCss: css,
                config: settings,
                isDefault: !!isDefault
            });

            return this.success(res, "Report template saved successfully", template);
        } catch (error: any) {
            console.error("[ReportController:saveTemplate] Error:", error);
            return this.error(res, 500, "Failed to save report template", error.message);
        }
    };
}
