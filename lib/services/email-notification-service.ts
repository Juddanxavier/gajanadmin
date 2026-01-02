import { createClient } from '@/lib/supabase/server';
import { render } from '@react-email/render';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
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
}

export class EmailService {
  private supabase: Awaited<ReturnType<typeof createClient>>;

  constructor(supabase: Awaited<ReturnType<typeof createClient>>) {
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
    const { shipmentId, tenantId, status, recipientEmail, recipientName } = params;

    try {
      // 1. Check for duplicate (database-level protection)
      const isDuplicate = await this.checkDuplicate(shipmentId, tenantId, status);
      if (isDuplicate) {
        console.log(`✅ Email already sent for shipment ${shipmentId} status ${status}`);
        return { success: true, message: 'Already sent (duplicate prevented)' };
      }

      // 2. Check rate limit (tenant-aware)
      const isRateLimited = await this.checkRateLimit(tenantId);
      if (isRateLimited) {
        console.warn(`⚠️ Rate limit exceeded for tenant ${tenantId}`);
        await this.logAttempt({
          ...params,
          status: 'failed',
          errorMessage: 'Rate limit exceeded',
        });
        return { success: false, message: 'Rate limit exceeded' };
      }

      // 3. Get tenant email configuration
      const emailConfig = await this.getTenantEmailConfig(tenantId);
      if (!emailConfig) {
        console.error(`❌ No email config for tenant ${tenantId}`);
        await this.logAttempt({
          ...params,
          status: 'failed',
          errorMessage: 'No email configuration found',
        });
        return { success: false, message: 'No email configuration' };
      }

      // 4. Generate QR code
      const trackingUrl = `${emailConfig.config.tracking_url}/track/${params.referenceCode}`;
      const qrCodeDataUrl = await this.generateQRCode(trackingUrl);

      // 5. Render email using React Email
      const emailHtml = await render(
        ShipmentNotificationEmail({
          recipientName,
          status,
          trackingNumber: params.trackingCode,
          referenceCode: params.referenceCode,
          trackingUrl,
          qrCodeDataUrl,
          invoiceAmount: params.invoiceAmount,
          invoiceCurrency: params.invoiceCurrency,
          companyName: emailConfig.config.company_name,
          deliveryDate: params.deliveryDate,
        })
      );

      const subject = this.getEmailSubject(status);

      const isDryRun = process.env.EMAIL_DRY_RUN === 'true';

      if (isDryRun) {
        // 6. Console log email instead of sending (for debugging)
        console.log('📧 ============ EMAIL PREVIEW (DRY RUN) ============');
        console.log('To:', recipientEmail, `(${recipientName})`);
        console.log('Subject:', subject);
        console.log('Provider:', emailConfig.provider_id);
        console.log('From:', emailConfig.config.from_email);
        console.log('Company:', emailConfig.config.company_name);
        console.log('Status:', status);
        console.log('Tracking URL:', trackingUrl);
        console.log('Invoice:', params.invoiceAmount ? `${params.invoiceCurrency} ${params.invoiceAmount}` : 'N/A');
        console.log('HTML Length:', emailHtml.length, 'characters');
        console.log('QR Code:', qrCodeDataUrl ? 'Generated ✅' : 'N/A');
        console.log('========================================');
      } else {
        // 6. Actually send emails
        if (emailConfig.provider_id === 'zeptomail') {
          await this.sendViaZeptoMail(emailConfig, recipientEmail, recipientName, subject, emailHtml);
        } else if (emailConfig.provider_id === 'smtp') {
          await this.sendViaSMTP(emailConfig, recipientEmail, recipientName, subject, emailHtml);
        }
      }

      // 7. Log success
      const logId = await this.logAttempt({
        ...params,
        status: 'sent',
        subject,
        body: emailHtml,
      });

      console.log(`✅ Email sent successfully to ${recipientEmail}`);
      return { success: true, message: 'Email sent', logId };

    } catch (error) {
      console.error('❌ Email sending failed:', error);
      
      // Log failure
      await this.logAttempt({
        ...params,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if email already sent for this shipment/status (prevent duplicates)
   */
  private async checkDuplicate(shipmentId: string, tenantId: string, status: string): Promise<boolean> {
    const subject = this.getEmailSubject(status);
    
    const { data } = await this.supabase
      .from('notification_logs')
      .select('id')
      .eq('shipment_id', shipmentId)
      .eq('tenant_id', tenantId)
      .eq('type', 'email')
      .eq('status', 'sent')
      .eq('subject', subject)
      .single();

    return !!data;
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
   * Get tenant email configuration
   */
  private async getTenantEmailConfig(tenantId: string): Promise<EmailConfig | null> {
    const { data, error } = await this.supabase
      .from('tenant_notification_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('channel', 'email')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data as EmailConfig;
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
   * Send email via ZeptoMail
   */
  private async sendViaZeptoMail(
    config: EmailConfig,
    toEmail: string,
    toName: string,
    subject: string,
    html: string
  ): Promise<void> {
    const response = await fetch('https://api.zeptomail.com/v1.1/email', {
      method: 'POST',
      headers: {
        'Authorization': config.credentials.api_key!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          address: config.config.from_email,
          name: config.config.from_name,
        },
        to: [{
          email_address: {
            address: toEmail,
            name: toName,
          },
        }],
        subject,
        htmlbody: html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ZeptoMail error: ${JSON.stringify(error)}`);
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
    html: string
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
  private async logAttempt(params: SendEmailParams & {
    status: 'sent' | 'failed';
    subject?: string;
    body?: string;
    errorMessage?: string;
  }): Promise<string | undefined> {
    const { data, error } = await this.supabase
      .from('notification_logs')
      .insert({
        tenant_id: params.tenantId,
        shipment_id: params.shipmentId,
        type: 'email',
        recipient: params.recipientEmail,
        subject: params.subject || this.getEmailSubject(params.status),
        body: params.body || '',
        status: params.status,
        error_message: params.errorMessage,
        sent_at: params.status === 'sent' ? new Date().toISOString() : null,
        rate_limit_key: `tenant:${params.tenantId}`,
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
   * Get email subject based on status
   */
  private getEmailSubject(status: string): string {
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
