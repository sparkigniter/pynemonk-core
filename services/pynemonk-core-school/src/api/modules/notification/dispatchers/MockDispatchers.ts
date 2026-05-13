import { INotificationDispatcher, NotificationChannel, NotificationPayload } from "../types.js";

export class EmailDispatcher implements INotificationDispatcher {
    public channel = NotificationChannel.EMAIL;
    
    public async send(payload: NotificationPayload): Promise<void> {
        console.log(`[EmailDispatcher] Sending email to ${payload.to}: ${payload.title}`);
        // Integration with SendGrid/AWS SES would go here
    }
}

export class SMSDispatcher implements INotificationDispatcher {
    public channel = NotificationChannel.SMS;
    
    public async send(payload: NotificationPayload): Promise<void> {
        console.log(`[SMSDispatcher] Sending SMS to ${payload.to}: ${payload.body}`);
        // Integration with Twilio would go here
    }
}

export class InAppDispatcher implements INotificationDispatcher {
    public channel = NotificationChannel.IN_APP;
    
    public async send(payload: NotificationPayload): Promise<void> {
        console.log(`[InAppDispatcher] Saving in-app notification for ${payload.to}`);
        // Save to database
    }
}
