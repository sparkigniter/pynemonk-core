export enum NotificationChannel {
    EMAIL = 'email',
    SMS = 'sms',
    PUSH = 'push',
    IN_APP = 'in_app'
}

export interface NotificationPayload {
    to: string | number;
    title: string;
    body: string;
    data?: any;
    metadata?: any;
}

export interface INotificationDispatcher {
    channel: NotificationChannel;
    send(payload: NotificationPayload): Promise<void>;
}
