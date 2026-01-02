
// SMTP Provider Implementation
// c:\websites\kajen\gajan\admin\lib\notifications\providers\smtp.ts

import nodemailer from 'nodemailer';
import { IEmailProvider, ProviderConfig, EmailPayload, SendResult } from './base';

export class SMTPProvider implements IEmailProvider {
    private transporter: nodemailer.Transporter;
    private config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.config = config;
        
        // Secure logic: 465 -> true, others -> false (unless explicitly set in credentials, which we might support later)
        // For now, inferred from port.
        const port = parseInt(config.credentials.port || '587');
        const secure = config.credentials.secure === true || port === 465;

        this.transporter = nodemailer.createTransport({
            host: config.credentials.host,
            port: port,
            secure: secure,
            auth: {
                user: config.credentials.user,
                pass: config.credentials.pass,
            },
            tls: {
                // If the user checked "Ignore SSL Errors" (future feature), we'd set rejectUnauthorized: false
                // rejectUnauthorized: false 
            }
        });
    }

    async validateConfig(): Promise<boolean> {
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('SMTP Validation Error:', error);
            return false;
        }
    }

    async sendEmail(payload: EmailPayload): Promise<SendResult> {
        const fromName = this.config.config.from_name || 'Shipment Alerts';
        const fromEmail = this.config.config.from_email || payload.from || this.config.credentials.user;
        const fromHeader = `"${fromName}" <${fromEmail}>`;

        try {
            const info = await this.transporter.sendMail({
                from: fromHeader,
                to: payload.to,
                subject: payload.subject,
                html: payload.html,
                text: payload.text,
            });
            
            return {
                success: true,
                messageId: info.messageId,
                metadata: info
            };
        } catch (error: any) {
             return {
                success: false,
                error: error.message,
                metadata: error
            };
        }
    }
}
