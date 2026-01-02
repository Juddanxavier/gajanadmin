
// Base Interfaces for Notification Providers
// c:\websites\kajen\gajan\admin\lib\notifications\providers\base.ts

export type NotificationChannel = 'email' | 'sms';

export interface ProviderConfig {
    id: string; // The UUID from tenant_notification_configs
    providerId: string; // 'smtp', 'twilio', etc.
    credentials: any; // User/Pass, API Keys
    config: any; // From Name, Sender ID
}

export interface SendResult {
    success: boolean;
    messageId?: string;
    error?: any;
    metadata?: any; // Raw response for debugging
}

export interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string; // Optional override
}

export interface SMSPayload {
    to: string;
    body: string;
    from?: string; // Optional override
}

// Base Provider Interface
export interface INotificationProvider {
    validateConfig(): Promise<boolean>;
}

export interface IEmailProvider extends INotificationProvider {
    sendEmail(payload: EmailPayload): Promise<SendResult>;
}

export interface ISMSProvider extends INotificationProvider {
    sendSMS(payload: SMSPayload): Promise<SendResult>;
}
