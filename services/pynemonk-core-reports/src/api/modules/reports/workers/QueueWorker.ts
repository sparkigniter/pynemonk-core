import { inject, injectable } from "tsyringe";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import ReportService from "../services/ReportService.js";
import Exporters from "../helpers/Exporters.js";
import SecurityHelper from "../helpers/SecurityHelper.js";
import EmailHelper from "../helpers/EmailHelper.js";

@injectable()
export default class QueueWorker {
    private isRunning = false;
    private intervalId: NodeJS.Timeout | null = null;
    private storageDir = path.join(process.cwd(), "storage/reports");

    constructor(
        @inject("DB") private db: Pool,
        @inject(ReportService) private reportService: ReportService,
        @inject(Exporters) private exporters: Exporters,
        @inject(SecurityHelper) private securityHelper: SecurityHelper,
        @inject(EmailHelper) private emailHelper: EmailHelper
    ) {
        // Ensure storage directory exists
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
    }

    /**
     * Start polling for pending report generation jobs
     */
    public start(intervalMs = 5000): void {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log(`[QueueWorker] Started background queue worker loop. Polling every ${intervalMs}ms...`);
        
        this.intervalId = setInterval(async () => {
            try {
                await this.pollAndProcess();
            } catch (err: any) {
                console.error("[QueueWorker] Error in poll loop:", err.message);
            }
        }, intervalMs);
    }

    /**
     * Stop the polling loop
     */
    public stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log("[QueueWorker] Stopped background queue worker loop.");
    }

    /**
     * Poll database for a PENDING job and process it
     */
    private async pollAndProcess(): Promise<void> {
        // Fetch one pending job, lock it using FOR UPDATE SKIP LOCKED for safe concurrent workers
        const query = `
            SELECT * FROM reports.job 
            WHERE status = 'PENDING' 
            ORDER BY created_at ASC 
            LIMIT 1 
            FOR UPDATE SKIP LOCKED
        `;
        const res = await this.db.query(query);
        if (res.rows.length === 0) return;

        const job = res.rows[0];
        console.log(`[QueueWorker] Picked up job ID: ${job.id} (Type: ${job.report_type}, Format: ${job.format})`);

        // Mark as PROCESSING
        await this.db.query(
            "UPDATE reports.job SET status = 'PROCESSING', updated_at = NOW() WHERE id = $1",
            [job.id]
        );

        try {
            await this.processJob(job);
        } catch (err: any) {
            console.error(`[QueueWorker] Job ${job.id} failed:`, err);
            await this.db.query(
                "UPDATE reports.job SET status = 'FAILED', error_message = $1, updated_at = NOW() WHERE id = $2",
                [err.message || "Unknown error during background generation", job.id]
            );
        }
    }

    /**
     * Build report dataset, export, compress if needed, and email
     */
    private async processJob(job: any): Promise<void> {
        const { id: jobId, tenant_id: tenantId, report_type: reportType, format, filters, password, email_dispatch: emailDispatch } = job;
        
        // 1. Fetch Tenant Name
        const tenantRes = await this.db.query("SELECT name FROM auth.tenant WHERE id = $1", [tenantId]);
        const tenantName = tenantRes.rows[0]?.name || "Luvia Institutional";

        // 2. Fetch Report Content
        console.log(`[QueueWorker] Fetching data for job ${jobId}...`);
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
            if (filters?.subType === "ap") {
                rawData = await this.reportService.getAPAgingReport(tenantId);
            } else {
                rawData = await this.reportService.getARAgingReport(tenantId, filters);
            }
        } else if (reportType === "student_grades") {
            rawData = await this.reportService.getStudentGrades(tenantId, filters);
        } else {
            throw new Error(`Unsupported report type: ${reportType}`);
        }

        // 3. Map/Format Data for Exporters
        const subType = reportType === "aging" ? filters?.subType : undefined;
        const exportData = this.reportService.prepareExportData(reportType, rawData, subType);

        // 4. Run Exporter based on format
        let outputBuffer: Buffer;
        const tempFileName = `temp_job_${jobId}_${Date.now()}.${format}`;
        const tempFilePath = path.join(this.storageDir, tempFileName);

        if (format === "csv") {
            const csvString = this.exporters.generateCSV(exportData.items, exportData.columns);
            outputBuffer = Buffer.from(csvString, "utf8");
        } else if (format === "xlsx") {
            outputBuffer = this.exporters.generateExcel(exportData.items, exportData.columns);
        } else if (format === "pdf") {
            // Load template
            const templates = await this.reportService.getReportTemplates(tenantId, reportType);
            const template = templates.find((t) => t.is_default) || templates[0];
            if (!template) {
                throw new Error(`No default template found for report type '${reportType}'. Please create one in Designer.`);
            }

            outputBuffer = await this.exporters.generatePDF(
                exportData,
                template.template_html,
                template.template_css,
                tenantName
            );
        } else {
            throw new Error(`Unsupported format: ${format}`);
        }

        // Write raw file temporarily
        fs.writeFileSync(tempFilePath, outputBuffer);

        let finalFilePath = tempFilePath;
        let finalFileName = tempFileName;

        // 5. Apply Zero-Dependency Password Protection if required
        if (password && password.trim().length > 0) {
            const zipFileName = `job_${jobId}_${Date.now()}.zip`;
            const zipFilePath = path.join(this.storageDir, zipFileName);
            
            try {
                await this.securityHelper.encryptZip(tempFilePath, zipFilePath, password);
                
                // Immediately delete unencrypted temp file for data security
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
                
                finalFilePath = zipFilePath;
                finalFileName = zipFileName;
            } catch (err: any) {
                // Cleanup temp file on encryption error
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
                throw new Error(`Encryption failed: ${err.message}`);
            }
        } else {
            // If no password, rename temp file to clean production name
            const cleanFileName = `job_${jobId}_${Date.now()}.${format}`;
            const cleanFilePath = path.join(this.storageDir, cleanFileName);
            fs.renameSync(tempFilePath, cleanFilePath);
            finalFilePath = cleanFilePath;
            finalFileName = cleanFileName;
        }

        // 6. Dispatch Email Attachment if requested
        if (emailDispatch && emailDispatch.trim().length > 0) {
            const subject = `Your Requested ${tenantName} Report: ${reportType.toUpperCase()}`;
            const body = `
                <p>Hello,</p>
                <p>Please find attached your requested <strong>${reportType.replace("_", " ").toUpperCase()}</strong> report generated by Pynemonk ERP.</p>
                <p><strong>Report Configuration:</strong></p>
                <ul>
                    <li>Tenant: ${tenantName}</li>
                    <li>Format: ${format.toUpperCase()}</li>
                    <li>Date: ${new Date().toLocaleString()}</li>
                    ${password ? "<li><strong>Security Alert:</strong> The attached file is locked inside a password-protected ZIP archive. Use your pre-configured password to open it.</li>" : ""}
                </ul>
                <p>Best regards,<br>Pynemonk ERP Team</p>
            `;
            
            try {
                await this.emailHelper.sendEmail(emailDispatch, subject, body, [
                    { filename: finalFileName, path: finalFilePath }
                ]);
            } catch (emailErr: any) {
                console.error(`[QueueWorker] Email dispatch failed for job ${jobId}:`, emailErr);
                // We completed report generation but email failed. Let's record this on the job but keep status as COMPLETED
                await this.db.query(
                    "UPDATE reports.job SET error_message = $1 WHERE id = $2",
                    [`Report generated, but email dispatch failed: ${emailErr.message}`, jobId]
                );
            }
        }

        // 7. Update Job Status to COMPLETED
        await this.db.query(
            "UPDATE reports.job SET status = 'COMPLETED', file_path = $1, error_message = NULL, updated_at = NOW() WHERE id = $2",
            [finalFilePath, jobId]
        );
        console.log(`[QueueWorker] Job ${jobId} successfully COMPLETED! Output: ${finalFilePath}`);
    }
}
