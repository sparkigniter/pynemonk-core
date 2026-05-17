import { INotificationDispatcher, NotificationChannel, NotificationPayload } from "../types.js";
import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import axios from "axios";

@injectable()
export class SendGridEmailDispatcher implements INotificationDispatcher {
    public channel = NotificationChannel.EMAIL;

    constructor(@inject("DB") private pool: Pool) {}

    public async send(payload: NotificationPayload): Promise<void> {
        const tenantId = payload.data?.tenantId;
        
        if (!tenantId) {
            console.warn("[SendGridEmailDispatcher] No tenantId provided. Falling back to mock.");
            console.log(`[Mock Email] To: ${payload.to}, Subject: ${payload.title}`);
            return;
        }

        const settingsRes = await this.pool.query(
            "SELECT key, value FROM school.settings WHERE tenant_id = $1 AND key IN ('email_provider', 'email_sendgrid_key', 'email_from', 'email_from_name')",
            [tenantId]
        );

        const settings = Object.fromEntries(settingsRes.rows.map(r => [r.key, r.value]));

        if (settings.email_provider !== 'sendgrid' || !settings.email_sendgrid_key) {
            console.warn(`[SendGridEmailDispatcher] SendGrid not configured for tenant ${tenantId}.`);
            console.log(`[Mock Email] To: ${payload.to}, Subject: ${payload.title}`);
            return;
        }

        try {
            await axios.post(
                'https://api.sendgrid.com/v2/mail.send.json', // Simple v2 or v3 API
                null,
                {
                    params: {
                        api_user: 'api_key', // SendGrid requirement for some endpoints
                        api_key: settings.email_sendgrid_key,
                        to: String(payload.to),
                        from: settings.email_from,
                        fromname: settings.email_from_name || 'Luvia Institution',
                        subject: payload.title,
                        text: payload.body,
                        html: payload.data?.html || `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">${payload.body}</div>`
                    }
                }
            );

            console.log(`[SendGridEmailDispatcher] Email sent successfully to ${payload.to}`);
        } catch (error: any) {
            // If v2 fails, try v3 (modern standard)
            try {
                await axios.post(
                    'https://api.sendgrid.com/v3/mail/send',
                    {
                        personalizations: [{ to: [{ email: String(payload.to) }] }],
                        from: { email: settings.email_from, name: settings.email_from_name || 'Luvia Institution' },
                        subject: payload.title,
                        content: [
                            { type: 'text/plain', value: payload.body },
                            { type: 'text/html', value: payload.data?.html || `<div>${payload.body}</div>` }
                        ]
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${settings.email_sendgrid_key}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log(`[SendGridEmailDispatcher] Email sent successfully via v3 to ${payload.to}`);
            } catch (v3Error: any) {
                console.error(`[SendGridEmailDispatcher] Failed to send Email:`, v3Error.response?.data || v3Error.message);
                throw v3Error;
            }
        }
    }
}
