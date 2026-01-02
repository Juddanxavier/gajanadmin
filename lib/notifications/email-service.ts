import { createAdminClient } from '@/lib/supabase/admin';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Email Service for Self-Hosted Supabase
 * Uses Next.js API route instead of Edge Functions
 */
class EmailService {
  /**
   * Send email via Next.js API route
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      console.log(`Email sent to ${options.to}`);
    } catch (error) {
      console.error('Email send error:', error);
      // Don't throw - log and continue to avoid breaking the app
      console.warn('Email notification failed, but continuing operation');
    }
  }

  /**
   * Send shipment status change notification
   */
  async sendStatusChangeNotification(
    to: string,
    shipment: {
      tracking_number: string;
      carrier: string;
      old_status: string;
      new_status: string;
      latest_location?: string;
    }
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; margin: 0; border-radius: 0 0 8px 8px; }
            .status { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 0 8px; }
            .status.delivered { background: #10b981; color: white; }
            .status.in_transit { background: #3b82f6; color: white; }
            .status.exception { background: #ef4444; color: white; }
            .status.pending { background: #f59e0b; color: white; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; padding: 20px; }
            .info-row { margin: 12px 0; padding: 12px; background: white; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📦 Shipment Status Update</h1>
            </div>
            <div class="content">
              <div class="info-row">
                <strong>Tracking Number:</strong> ${shipment.tracking_number}
              </div>
              <div class="info-row">
                <strong>Carrier:</strong> ${shipment.carrier.toUpperCase()}
              </div>
              <div class="info-row">
                <strong>Status Changed:</strong><br/>
                <span class="status ${shipment.old_status}">${shipment.old_status.replace('_', ' ').toUpperCase()}</span>
                →
                <span class="status ${shipment.new_status}">${shipment.new_status.replace('_', ' ').toUpperCase()}</span>
              </div>
              ${shipment.latest_location ? `
              <div class="info-row">
                <strong>Latest Location:</strong> ${shipment.latest_location}
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>This is an automated notification from your shipment tracking system.</p>
              <p style="color: #9ca3af; font-size: 11px;">Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: `Shipment ${shipment.tracking_number} - Status Updated to ${shipment.new_status.replace('_', ' ')}`,
      html,
    });
  }

  /**
   * Send delivery notification
   */
  async sendDeliveryNotification(
    to: string,
    shipment: {
      tracking_number: string;
      carrier: string;
      delivered_at?: string;
      customer_name?: string;
    }
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; margin: 0; text-align: center; border-radius: 0 0 8px 8px; }
            .success { color: #10b981; font-size: 64px; margin: 20px 0; }
            .info-row { margin: 12px 0; padding: 12px; background: white; border-radius: 4px; text-align: left; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Package Delivered!</h1>
            </div>
            <div class="content">
              <div class="success">✓</div>
              <h2 style="color: #10b981; margin: 0 0 20px 0;">Your package has been successfully delivered</h2>
              ${shipment.customer_name ? `<p style="font-size: 16px; color: #6b7280;">Dear ${shipment.customer_name},</p>` : ''}
              <div class="info-row">
                <strong>Tracking Number:</strong> ${shipment.tracking_number}
              </div>
              <div class="info-row">
                <strong>Carrier:</strong> ${shipment.carrier.toUpperCase()}
              </div>
              ${shipment.delivered_at ? `
              <div class="info-row">
                <strong>Delivered At:</strong> ${new Date(shipment.delivered_at).toLocaleString()}
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <p style="font-size: 14px; color: #10b981; font-weight: bold;">Thank you for your business!</p>
              <p style="color: #9ca3af; font-size: 11px;">This is an automated notification.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: `📦 Package Delivered - ${shipment.tracking_number}`,
      html,
    });
  }

  /**
   * Send exception notification
   */
  async sendExceptionNotification(
    to: string,
    shipment: {
      tracking_number: string;
      carrier: string;
      latest_location?: string;
      description?: string;
    }
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; margin: 0; border-radius: 0 0 8px 8px; }
            .warning { color: #ef4444; font-size: 48px; text-align: center; margin: 20px 0; }
            .info-row { margin: 12px 0; padding: 12px; background: white; border-radius: 4px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⚠️ Shipment Exception</h1>
            </div>
            <div class="content">
              <div class="warning">!</div>
              <h2 style="text-align: center; color: #ef4444;">Attention Required</h2>
              <p style="text-align: center;">There's an issue with your shipment that needs attention.</p>
              <div class="info-row">
                <strong>Tracking Number:</strong> ${shipment.tracking_number}
              </div>
              <div class="info-row">
                <strong>Carrier:</strong> ${shipment.carrier.toUpperCase()}
              </div>
              ${shipment.latest_location ? `
              <div class="info-row">
                <strong>Last Known Location:</strong> ${shipment.latest_location}
              </div>
              ` : ''}
              ${shipment.description ? `
              <div class="info-row">
                <strong>Details:</strong> ${shipment.description}
              </div>
              ` : ''}
              <p style="text-align: center; margin-top: 20px; color: #6b7280;">
                Please contact the carrier for more information.
              </p>
            </div>
            <div class="footer">
              <p style="color: #9ca3af; font-size: 11px;">This is an automated notification.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: `⚠️ Shipment Exception - ${shipment.tracking_number}`,
      html,
    });
  }
}

export const emailService = new EmailService();
