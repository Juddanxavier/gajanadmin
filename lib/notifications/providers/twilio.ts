
// Twilio Provider Implementation
// c:\websites\kajen\gajan\admin\lib\notifications\providers\twilio.ts

import { ISMSProvider, ProviderConfig, SMSPayload, SendResult } from './base';
import twilio from 'twilio'; // Requires: npm install twilio

export class TwilioProvider implements ISMSProvider {
    private client: any;
    private config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.config = config;
        // Credentials: { accountSid, authToken }
        this.client = twilio(config.credentials.accountSid, config.credentials.authToken);
    }

    async validateConfig(): Promise<boolean> {
        try {
            // Lightweight check: Fetch account details
             await this.client.api.accounts(this.config.credentials.accountSid).fetch();
             return true;
        } catch (error) {
            console.error('Twilio Validation Error:', error);
            return false;
        }
    }

    async sendSMS(payload: SMSPayload): Promise<SendResult> {
        const fromNumber = this.config.config.from_number; // e.g., +15005550006

        try {
            const message = await this.client.messages.create({
                body: payload.body,
                from: fromNumber,
                to: payload.to
            });

            return {
                success: true,
                messageId: message.sid,
                metadata: { status: message.status }
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
