import { INotificationDispatcher, NotificationChannel, NotificationPayload } from "../types.js";
import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import axios from "axios";

@injectable()
export class TwilioSMSDispatcher implements INotificationDispatcher {
    public channel = NotificationChannel.SMS;

    constructor(@inject("DB") private pool: Pool) {}

    public async send(payload: NotificationPayload): Promise<void> {
        // 1. Resolve tenant settings (in a real app, this should be cached or passed in)
        // Since payload.to is usually a student/guardian, we need their tenant_id.
        // Assuming metadata or data contains tenant_id for simplicity here.
        const tenantId = payload.data?.tenantId;
        
        if (!tenantId) {
            console.warn("[TwilioSMSDispatcher] No tenantId provided in payload data. Falling back to mock.");
            console.log(`[Mock SMS] To: ${payload.to}, Body: ${payload.body}`);
            return;
        }

        const settingsRes = await this.pool.query(
            "SELECT key, value FROM school.settings WHERE tenant_id = $1 AND key IN ('sms_provider', 'sms_twilio_sid', 'sms_twilio_token', 'sms_twilio_from')",
            [tenantId]
        );

        const settings = Object.fromEntries(settingsRes.rows.map(r => [r.key, r.value]));

        if (settings.sms_provider !== 'twilio' || !settings.sms_twilio_sid || !settings.sms_twilio_token) {
            console.warn(`[TwilioSMSDispatcher] Twilio not configured for tenant ${tenantId}.`);
            console.log(`[Mock SMS] To: ${payload.to}, Body: ${payload.body}`);
            return;
        }

        try {
            const auth = Buffer.from(`${settings.sms_twilio_sid}:${settings.sms_twilio_token}`).toString('base64');
            
            const params = new URLSearchParams();
            params.append('To', String(payload.to));
            params.append('From', settings.sms_twilio_from);
            params.append('Body', payload.body);

            await axios.post(
                `https://api.twilio.com/2010-04-01/Accounts/${settings.sms_twilio_sid}/Messages.json`,
                params,
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            console.log(`[TwilioSMSDispatcher] SMS sent successfully to ${payload.to}`);
        } catch (error: any) {
            console.error(`[TwilioSMSDispatcher] Failed to send SMS to ${payload.to}:`, error.response?.data || error.message);
            throw error;
        }
    }
}
