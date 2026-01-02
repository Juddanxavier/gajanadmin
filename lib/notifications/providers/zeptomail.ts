
// ZeptoMail Provider Implementation
// c:\websites\kajen\gajan\admin\lib\notifications\providers\zeptomail.ts

import { IEmailProvider, ProviderConfig, EmailPayload, SendResult } from './base';
// @ts-ignore
import { SendMailClient } from "zeptomail";

export class ZeptoMailProvider implements IEmailProvider {
    private config: ProviderConfig;
    // Default to .in but overridable
    private apiUrl: string = 'https://api.zeptomail.in/v1.1/email'; 

    constructor(config: ProviderConfig) {
        this.config = config;
        if (config.config.api_url) {
            this.apiUrl = config.config.api_url;
        }
    }

    async validateConfig(): Promise<boolean> {
        if (!this.config.credentials.apiKey) return false;
        return true;
    }

    async sendEmail(payload: EmailPayload): Promise<SendResult> {
        // Handle "Zoho-enczapikey " prefix if user didn't include it.
        let rawToken = (this.config.credentials.apiKey || '').trim();
        
        // Debug Log (Masked)
        const isPrefixPresent = rawToken.startsWith('Zoho-enczapikey');
        const tokenForLog = isPrefixPresent 
            ? `Zoho-enczapikey ...${rawToken.slice(-6)}` 
            : `(Missing Prefix) ...${rawToken.slice(-6)}`;
            
        let token = rawToken;
        if (!isPrefixPresent && rawToken.length > 0) {
            token = `Zoho-enczapikey ${rawToken}`;
        }

        const client = new SendMailClient({
            url: this.apiUrl, 
            token: token
        });

        const fromEmail = this.config.config.from_email || 'noreply@gajantraders.com';
        const fromName = this.config.config.from_name || 'Gajan Traders';

        console.log(`[ZeptoMail] Config: URL=${this.apiUrl}, Token=${tokenForLog}, From=${fromEmail}`);

        try {
            console.log(`[ZeptoMail] Sending to ${payload.to}...`);
            
            const response = await client.sendMail({
                "from": {
                    "address": fromEmail,
                    "name": fromName
                },
                "to": [
                    {
                        "email_address": {
                            "address": payload.to,
                            "name": "Recipient"
                        }
                    }
                ],
                "subject": payload.subject,
                "htmlbody": payload.html,
            });

            console.log('[ZeptoMail] Success:', JSON.stringify(response));

            return {
                success: true,
                messageId: 'sent', // SDK response structure varies, assuming success
                metadata: response
            };

        } catch (error: any) {
            console.error('[ZeptoMail] Error:', error);
            return {
                success: false,
                error: error.message || JSON.stringify(error),
                metadata: error
            };
        }
    }
}
