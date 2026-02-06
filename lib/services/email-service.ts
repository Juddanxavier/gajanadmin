/** @format */

import { logger } from '../logger';
import { createAdminClient } from '../supabase/admin';
import { render } from '@react-email/render';
import ShipmentNotification from '@/emails/shipment-notification';
import nodemailer from 'nodemailer';
// @ts-ignore
import { SendMailClient } from 'zeptomail';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}

export class EmailService {
  /**
   * Send a transactional email using the tenant's configured provider
   */
  async sendEmail(
    tenantId: string,
    options: EmailOptions,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // 1. Get Tenant Config
      const supabase = createAdminClient();
      const { data: config } = await supabase
        .from('tenant_notification_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('channel', 'email')
        .eq('is_active', true)
        .single();

      if (!config) {
        // Fallback: Check Environment Variables
        const zeptoKey = process.env.ZEPTOMAIL_API_KEY;
        const smtpHost = process.env.SMTP_HOST;

        if (zeptoKey) {
          logger.info('Using Environment Variables (ZeptoMail) for tenant', {
            tenantId,
          });
          return await this.sendViaZeptoMail(
            { api_key: zeptoKey, ...this.getEnvSender() },
            options,
          );
        } else if (smtpHost) {
          logger.info('Using Environment Variables (SMTP) for tenant', {
            tenantId,
          });
          return await this.sendViaSMTP(this.getEnvSMTP(), options);
        }

        logger.warn('No active email configuration found for tenant', {
          tenantId,
        });
        return { success: false, error: 'Email configuration not found' };
      }

      const { provider_id, credentials } = config;

      // 2. Send based on Provider
      if (provider_id === 'zeptomail') {
        return await this.sendViaZeptoMail(credentials, options);
      } else if (provider_id === 'smtp') {
        return await this.sendViaSMTP(credentials, options);
      } else {
        return {
          success: false,
          error: `Unsupported provider: ${provider_id}`,
        };
      }
    } catch (error: any) {
      logger.error('Email send failed', {
        error: error.message,
        tenantId,
        to: options.to,
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send templated email
   */
  async sendTemplateEmail(params: {
    tenantId: string;
    to: string;
    templateType: string;
    variables: Record<string, string>;
  }) {
    const supabase = createAdminClient();

    // 1. Fetch Template
    let { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .eq('type', params.templateType)
      .eq('is_active', true)
      .single();

    if (!template) {
      logger.warn(
        'Email template not found in DB, using React Email Fallback',
        {
          tenantId: params.tenantId,
          type: params.templateType,
        },
      );

      // Use React Email Component
      const emailHtml = await render(
        ShipmentNotification({
          trackingCode: params.variables.tracking_code || 'Unknown',
          status: params.variables.new_status || 'Update',
          customerName: params.variables.customer_name || 'Customer',
          trackingUrl: `https://gajantraders.com/track/${params.variables.tracking_code}`,
          message: `Your shipment status is now: ${params.variables.new_status}`,
        }),
      );

      // Return immediately with the rendered HTML
      // This bypasses the DB template variable replacement logic which is unnecessary here
      return await this.sendEmail(params.tenantId, {
        to: params.to,
        subject: `Shipment Update: ${params.variables.tracking_code}`,
        html: emailHtml,
      });
    }

    // 2. Compile Content
    const subject = this.replaceVariables(
      template.subject_template,
      params.variables,
    );
    const heading = this.replaceVariables(
      template.heading_template || '',
      params.variables,
    );
    const body = this.replaceVariables(
      template.body_template || '',
      params.variables,
    );

    // 3. Construct HTML (Basic wrapper)
    // In a real app we might use React Email here, but for dynamic DB templates
    // we assume they are snippets injected into a layout.
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { margin-bottom: 20px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            ${heading ? `<h2>${heading}</h2>` : ''}
            <div>${body}</div>
            <div class="footer">
              <p>Powered by Gajan</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // 4. Send
    return await this.sendEmail(params.tenantId, {
      to: params.to,
      subject,
      html,
    });
  }

  private replaceVariables(text: string, variables: Record<string, string>) {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      // Replace {{key}} case-insensitive
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  private async sendViaSMTP(credentials: any, options: EmailOptions) {
    const transporter = nodemailer.createTransport({
      host: credentials.host,
      port: Number(credentials.port) || 587,
      secure: Number(credentials.port) === 465, // true for 465, false for other ports
      auth: {
        user: credentials.username,
        pass: credentials.password,
      },
    });

    const info = await transporter.sendMail({
      from: `"${options.fromName || credentials.from_name || 'Notifications'}" <${
        options.fromEmail || credentials.from_email || credentials.username
      }>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    return { success: true, messageId: info.messageId };
  }

  private async sendViaZeptoMail(credentials: any, options: EmailOptions) {
    // ZeptoMail SDK Usage
    // url: "api.zeptomail.com/" (default)
    const url = 'api.zeptomail.com/';
    const token = credentials.api_key;

    if (!token) return { success: false, error: 'ZeptoMail API Key missing' };

    try {
      const client = new SendMailClient({ url, token });
      const resp = await client.sendMail({
        from: {
          address:
            options.fromEmail ||
            credentials.from_email ||
            'noreply@yourdomain.com',
          name: options.fromName || credentials.from_name || 'Notifications',
        },
        to: [
          {
            email_address: {
              address: options.to,
              name: 'Recipient', // We could pass name if available
            },
          },
        ],
        subject: options.subject,
        htmlbody: options.html,
      });

      return { success: true, messageId: resp.data?.[0]?.message_id }; // Adjust based on actual Zepto response structure
    } catch (err: any) {
      logger.error('ZeptoMail API Error', err);
      // Fallback: Try valid URL if default failed?
      // The SDK might throw formatted errors.
      return { success: false, error: err.message || JSON.stringify(err) };
    }
  }
  private getEnvSender() {
    return {
      from_email:
        process.env.SMTP_FROM_EMAIL || process.env.NEXT_PUBLIC_APP_EMAIL,
      from_name: process.env.SMTP_FROM_NAME || 'Notifications',
    };
  }

  private getEnvSMTP() {
    return {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      username: process.env.SMTP_USERNAME || process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
      ...this.getEnvSender(),
    };
  }
}

export const emailService = new EmailService();
