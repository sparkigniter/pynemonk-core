import { injectable, injectAll } from "tsyringe";
import { INotificationDispatcher, NotificationChannel, NotificationPayload } from "../types.js";

@injectable()
export default class NotificationService {
    constructor(
        @injectAll("NotificationDispatcher") private dispatchers: INotificationDispatcher[]
    ) {}

    public async notify(channels: NotificationChannel[], payload: NotificationPayload): Promise<void> {
        const activeDispatchers = this.dispatchers.filter(d => channels.includes(d.channel));
        
        await Promise.all(
            activeDispatchers.map(d => 
                d.send(payload).catch((err: any) => {
                    console.error(`Failed to send notification via ${d.channel}:`, err);
                })
            )
        );
    }

    public async notifyStudent(studentId: number, channels: NotificationChannel[], payload: NotificationPayload): Promise<void> {
        // Here you would fetch student contact info (email/phone)
        // For now, we assume payload already has contact info or we'd resolve it here
        await this.notify(channels, payload);
    }
}
