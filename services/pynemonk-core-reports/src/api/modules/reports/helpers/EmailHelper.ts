import { injectable } from "tsyringe";
import nodemailer from "nodemailer";

@injectable()
export default class EmailHelper {
    private transporter: nodemailer.Transporter | null = null;

    constructor() {
        this.initTransporter();
    }

    private initTransporter(): void {
        const host = process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_PORT || "587");
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;

        // If credentials are not present, log a warning and run in mock mode
        if (!host || !user || !pass) {
            console.warn("[EmailHelper] SMTP host or credentials not configured. EmailHelper will run in MOCK mode.");
            return;
        }

        try {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465 || process.env.SMTP_SECURE === "true",
                auth: { user, pass },
                tls: {
                    rejectUnauthorized: false
                }
            });
            console.log(`[EmailHelper] Transporter successfully initialized for SMTP host: ${host}:${port}`);
        } catch (err) {
            console.error("[EmailHelper] Failed to initialize SMTP transporter:", err);
        }
    }

    /**
     * Dispatch an email with optional attachments.
     */
    public async sendEmail(
        to: string,
        subject: string,
        htmlBody: string,
        attachments: { filename: string; path: string }[] = []
    ): Promise<void> {
        const from = process.env.SMTP_FROM || "Pynemonk ERP <no-reply@pynemonk.com>";

        if (!this.transporter) {
            console.log("=================== [EmailHelper: MOCK DISPATCH] ===================");
            console.log(`To:          ${to}`);
            console.log(`Subject:     ${subject}`);
            console.log(`Body Snippet: ${htmlBody.substring(0, 150)}...`);
            console.log(`Attachments: ${JSON.stringify(attachments)}`);
            console.log("====================================================================");
            return;
        }

        try {
            console.log(`[EmailHelper] Dispatching email to: ${to} (Attachments: ${attachments.length})...`);
            await this.transporter.sendMail({
                from,
                to,
                subject,
                html: htmlBody,
                attachments
            });
            console.log(`[EmailHelper] Email successfully sent to ${to}`);
        } catch (err: any) {
            console.error(`[EmailHelper] Failed to dispatch email to ${to}:`, err.message);
            throw new Error(`Email dispatch failed: ${err.message}`);
        }
    }
}
