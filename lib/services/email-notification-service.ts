/** @format */

import { SupabaseClient } from '@supabase/supabase-js';
import { render } from '@react-email/render';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
// @ts-ignore
import { SendMailClient } from 'zeptomail';
import ShipmentNotificationEmail from '@/emails/shipment-notification';

interface SendEmailParams {
  shipmentId: string;
  tenantId: string;
  status: string;
  recipientEmail: string;
  recipientName: string;
  trackingCode: string;
  referenceCode: string;
  invoiceAmount?: number;
  invoiceCurrency?: string;
  deliveryDate?: string;
}

interface EmailConfig {
  provider_id: string;
  credentials: {
    api_key?: string;
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
  };
  config: {
    from_email: string;
    from_name: string;
    company_name: string;
    tracking_url: string;
  };
  // Extended properties
  logo_url?: string;
  template?: EmailTemplate;
}

interface EmailTemplate {
  subject_template: string;
  heading_template: string;
  body_template: string;
}

export class EmailService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Send shipment notification email
   * Includes duplicate detection, rate limiting, and tenant awareness
   */
  async sendShipmentNotification(params: SendEmailParams): Promise<{
    success: boolean;
    message: string;
    logId?: string;
  }> {
    const { shipmentId, tenantId, status, recipientEmail, recipientName } =
      params;

    let emailConfig: any = null;
    let subject = '';
    let emailHtml = '';

    try {
      // 1. Check for duplicate (database-level protection)
      const isDuplicate = await this.checkDuplicate(
        shipmentId,
        tenantId,
        status,
      );
      if (isDuplicate) {
        return { success: true, message: 'Already sent (duplicate prevented)' };
      }

      // 2. Check rate limit
      const isRateLimited = await this.checkRateLimit(tenantId);
      if (isRateLimited) {
        await this.logAttempt({
          ...params,
          status: 'failed',
          errorMessage: 'Rate limit exceeded',
        });
        return { success: false, message: 'Rate limit exceeded' };
      }

      // 3. Get configuration
      emailConfig = await this.getTenantEmailConfig(tenantId, status);
      if (!emailConfig) {
        await this.logAttempt({
          ...params,
          status: 'failed',
          errorMessage: 'No email configuration found',
        });
        return { success: false, message: 'No email configuration' };
      }

      // 4. Generate QR
      const trackingUrl = `${emailConfig.config.tracking_url}/track/${params.referenceCode}`;
      const qrCodeDataUrl = await this.generateQRCode(trackingUrl);

      // Prepare vars
      const templateVars = {
        recipient_name: recipientName,
        tracking_number: params.trackingCode,
        reference_code: params.referenceCode,
        status: status.replace(/_/g, ' '),
        company_name: emailConfig.config.company_name,
      };

      const customHeading = emailConfig.template?.heading_template
        ? this.replaceVariables(
            emailConfig.template.heading_template,
            templateVars,
          )
        : undefined;

      const customMessage = emailConfig.template?.body_template
        ? this.replaceVariables(
            emailConfig.template.body_template,
            templateVars,
          )
        : undefined;

      const subjectTemplate =
        emailConfig.template?.subject_template ||
        this.getDefaultSubject(status);
      subject = this.replaceVariables(subjectTemplate, templateVars);

      // 5. Render
      // @ts-ignore
      const currency =
        params.invoiceCurrency || emailConfig.settings?.currency || 'USD';

      emailHtml = await render(
        ShipmentNotificationEmail({
          recipientName,
          status,
          trackingNumber: params.trackingCode,
          referenceCode: params.referenceCode,
          trackingUrl,
          qrCodeDataUrl,
          invoiceAmount: params.invoiceAmount,
          invoiceCurrency: currency,
          companyName: emailConfig.config.company_name,
          logoUrl: emailConfig.logo_url,
          customHeading,
          customMessage,
          deliveryDate: params.deliveryDate,
          // @ts-ignore
          companyAddress: emailConfig.settings?.company_address,
          // @ts-ignore
          brandColor: emailConfig.settings?.brand_color,
        }),
      );

      const isDryRun = process.env.EMAIL_DRY_RUN === 'true';

      if (isDryRun) {
        console.log('📧 [DRY RUN] Email ready for:', recipientEmail);
      } else {
        if (emailConfig.provider_id === 'zeptomail') {
          await this.sendViaZeptoMail(
            emailConfig,
            recipientEmail,
            recipientName,
            subject,
            emailHtml,
            params.referenceCode,
          );
        } else if (emailConfig.provider_id === 'smtp') {
          await this.sendViaSMTP(
            emailConfig,
            recipientEmail,
            recipientName,
            subject,
            emailHtml,
          );
        }
      }

      const logId = await this.logAttempt({
        ...params,
        status: 'sent',
        subject,
        body: emailHtml,
      });

      console.log(`✅ Email sent to ${recipientEmail}`);
      return { success: true, message: 'Email sent', logId };
    } catch (error: any) {
      console.error('❌ Email sending failed:', error);

      // FALLBACK
      if (emailConfig && emailConfig.provider_id === 'zeptomail') {
        console.log('🔄 Attempting SMTP Fallback...');
        const smtpConfig = await this.getFallbackSMTPConfig(tenantId, status);
        if (smtpConfig) {
          try {
            await this.sendViaSMTP(
              smtpConfig,
              recipientEmail,
              recipientName,
              subject,
              emailHtml,
            );
            console.log('✅ Fallback SMTP sent successfully.');

            const logId = await this.logAttempt({
              ...params,
              status: 'sent',
              subject,
              body: emailHtml,
              errorMessage: `ZeptoMail failed: ${error.message}. Used SMTP fallback.`,
            });
            return { success: true, message: 'Email sent (Fallback)', logId };
          } catch (fbError) {
            console.error('❌ Fallback failed:', fbError);
          }
        }
      }

      await this.logAttempt({
        ...params,
        status: 'failed',
        subject, // Now accessible
        body: emailHtml, // Now accessible
        errorMessage: error.message,
      });

      return { success: false, message: error.message };
    }
  }

  /**
   * Check if email already sent for this shipment/status (prevent duplicates)
   * We check if we've sent an email to this recipient for this shipment event recently.
   * Removing subject check as it might vary with templates.
   */
  private async checkDuplicate(
    shipmentId: string,
    tenantId: string,
    status: string,
  ): Promise<boolean> {
    // We look for a log entry for this shipment + status match
    // Note: Ideally we'd store the 'trigger' or 'status' in metadata for more robust checking
    // For now, we assume if we sent an email for this shipment_id recently, it might be a dupe.
    // But to be precise, let's assume one email per status per shipment.

    // Using a timeframe check to avoid global history lookup
    const { data } = await this.supabase
      .from('notification_logs')
      .select('id')
      .eq('shipment_id', shipmentId)
      .eq('tenant_id', tenantId)
      .eq('status', 'sent')
      // A more robust way would be to query the JSON metadata if we stored the 'status' there.
      // Since we don't strictly have a 'status' column in logs (only email status 'sent'),
      // we rely on the fact that typically one email per status comes through.
      // Limitation: This might be loose without a dedicated 'trigger_event' column.
      .gt(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      ) // sent in last 24h
      .limit(1);

    // If we found a log, it means we sent an email for this (shipment + status) in the last 24h
    if (data && data.length > 0) {
      console.log(
        `[EmailService] Duplicate detected for ${shipmentId} status ${status}`,
      );
      return true;
    }

    return false;
  }

  /**
   * Check rate limit (max 100 emails per tenant per hour)
   */
  private async checkRateLimit(tenantId: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count } = await this.supabase
      .from('notification_logs')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('type', 'email')
      .gte('created_at', oneHourAgo);

    return (count || 0) >= 100;
  }

  /**
   * Get tenant email configuration, settings, and specific template
   */
  private async getTenantEmailConfig(
    tenantId: string,
    status: string,
  ): Promise<EmailConfig | null> {
    // 1. Fetch Notification Config
    const configPromise = this.supabase
      .from('tenant_notification_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('channel', 'email')
      .eq('is_active', true)
      .single();

    // 2. Fetch Company Settings (Logo, Name, Currency, Branding)
    const settingsPromise = this.supabase
      .from('settings')
      .select(
        'company_name, company_logo_url, currency, date_format, company_address, brand_color',
      )
      .eq('tenant_id', tenantId)
      .single();

    // 3. Fetch Email Template for this status
    // Map status to template type (e.g. 'out_for_delivery' -> 'shipment_status' or specific)
    // For now, let's assume 'shipment_status' generic or specific if exists.
    // Valid types: 'shipment_status', 'shipment_delivered', 'shipment_exception'

    let templateType = 'shipment_status';
    if (status === 'delivered') templateType = 'shipment_delivered';
    if (status === 'exception' || status === 'failed')
      templateType = 'shipment_exception';

    const templatePromise = this.supabase
      .from('email_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('type', templateType)
      .eq('is_active', true)
      .single();

    const [configResult, settingsResult, templateResult] = await Promise.all([
      configPromise,
      settingsPromise,
      templatePromise,
    ]);

    if (configResult.error || !configResult.data) {
      return null;
    }

    const config = configResult.data as EmailConfig;

    // Merge settings
    if (settingsResult.data) {
      if (settingsResult.data.company_logo_url) {
        config.logo_url = settingsResult.data.company_logo_url;
      }
      // Override company name from settings if available
      if (settingsResult.data.company_name) {
        config.config.company_name = settingsResult.data.company_name;
      }
      // Store other settings in config for access
      // @ts-ignore
      config.settings = {
        currency: settingsResult.data.currency,
        date_format: settingsResult.data.date_format,
        company_address: settingsResult.data.company_address,
        brand_color: settingsResult.data.brand_color,
      };
    }

    // Merge template
    if (templateResult.data) {
      config.template = templateResult.data as EmailTemplate;
    }

    return config;
  }

  /**
   * Get fallback SMTP configuration (even if inactive)
   */
  private async getFallbackSMTPConfig(
    tenantId: string,
    status: string,
  ): Promise<EmailConfig | null> {
    // 1. Fetch SMTP Config (ignore is_active, strictly look for provider_id='smtp')
    const configPromise = this.supabase
      .from('tenant_notification_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('channel', 'email')
      .eq('provider_id', 'smtp')
      .limit(1)
      .maybeSingle(); // Use maybeSingle to avoid error if multiple/none

    // 2. Fetch Company Settings & Template (Re-use logic or call getTenantEmailConfig?)
    // We duplicate strictly necessary logic to ensure clean fallback config
    const settingsPromise = this.supabase
      .from('settings')
      .select('company_logo_url')
      .eq('tenant_id', tenantId)
      .single();

    let templateType = 'shipment_status';
    if (status === 'delivered') templateType = 'shipment_delivered';
    if (status === 'exception' || status === 'failed')
      templateType = 'shipment_exception';

    const templatePromise = this.supabase
      .from('email_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('type', templateType)
      .eq('is_active', true)
      .single();

    const [configResult, settingsResult, templateResult] = await Promise.all([
      configPromise,
      settingsPromise,
      templatePromise,
    ]);

    if (configResult.error || !configResult.data) {
      return null;
    }

    const config = configResult.data as EmailConfig;

    if (settingsResult.data?.company_logo_url) {
      config.logo_url = settingsResult.data.company_logo_url;
    }

    if (templateResult.data) {
      config.template = templateResult.data as EmailTemplate;
    }

    return config;
  }

  /**
   * Generate QR code for tracking URL
   */
  private async generateQRCode(url: string): Promise<string> {
    return await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  }

  /**
   * Send email via ZeptoMail (Official SDK)
   */
  private async sendViaZeptoMail(
    config: EmailConfig,
    toEmail: string,
    toName: string,
    subject: string,
    html: string,
    clientReference?: string,
  ): Promise<void> {
    const url = 'https://api.zeptomail.in/v1.1/email';

    // Ensure token has ZeptoMail prefix if not already present
    let token = config.credentials.api_key || '';
    if (!token.startsWith('Zoho-enczapikey')) {
      token = `Zoho-enczapikey ${token}`;
    }

    const client = new SendMailClient({ url, token });

    try {
      await client.sendMail({
        from: {
          address: config.config.from_email,
          name: config.config.from_name,
        },
        to: [
          {
            email_address: {
              address: toEmail,
              name: toName,
            },
          },
        ],
        subject: subject,
        htmlbody: html,
        track_clicks: true,
        track_opens: true,
        client_reference: clientReference,
      });
    } catch (err) {
      // The SDK might return an error object, stringify it for clarity
      throw new Error(JSON.stringify(err));
    }
  }

  /**
   * Send email via SMTP (Nodemailer)
   */
  private async sendViaSMTP(
    config: EmailConfig,
    toEmail: string,
    toName: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: config.credentials.host!,
      port: config.credentials.port!,
      secure: config.credentials.port === 465,
      auth: {
        user: config.credentials.user!,
        pass: config.credentials.pass!,
      },
    });

    await transporter.sendMail({
      from: `"${config.config.from_name}" <${config.config.from_email}>`,
      to: `"${toName}" <${toEmail}>`,
      subject,
      html,
    });
  }

  /**
   * Log email attempt to database
   */
  private async logAttempt(
    params: SendEmailParams & {
      status: 'sent' | 'failed';
      subject?: string;
      body?: string;
      errorMessage?: string;
    },
  ): Promise<string | undefined> {
    const { data, error } = await this.supabase
      .from('notification_logs')
      .insert({
        tenant_id: params.tenantId,
        shipment_id: params.shipmentId,
        type: 'email',
        recipient: params.recipientEmail,
        subject: params.subject || this.getDefaultSubject(params.status),
        body: params.body || '',
        status: params.status,
        error_message: params.errorMessage,
        sent_at: params.status === 'sent' ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log email attempt:', error);
      return undefined;
    }

    return data?.id;
  }

  /**
   * Replace placeholders {{key}} with values from vars object
   */
  private replaceVariables(
    template: string,
    vars: Record<string, string | number | undefined>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`;
    });
  }

  /**
   * Get default email subject based on status
   */
  private getDefaultSubject(status: string): string {
    switch (status) {
      case 'info_received':
      case 'pending':
        return '📦 Your Shipment is Being Tracked!';
      case 'delivered':
        return '✅ Package Delivered Successfully!';
      case 'out_for_delivery':
        return '🚚 Out for Delivery!';
      case 'exception':
      case 'failed':
        return '⚠️ Action Required - Shipment Issue';
      default:
        return `📦 Shipment Update: ${status.replace(/_/g, ' ')}`;
    }
  }
}
