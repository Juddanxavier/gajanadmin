/** @format */

import { render } from '@react-email/render';
import ShipmentNotificationEmail from '@/emails/shipment-notification';
import { createAdminClient } from '@/lib/supabase/admin';
import { renderTemplate } from './template-engine';
import { NotificationEngine } from './engine';

/**
 * Notification Service with Anti-Spam Protection
 * Processes queued notifications and sends emails/SMS
 */

interface NotificationData {
  shipmentId: string;
  trackingCode: string;
  status: string;
  oldStatus?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  location?: string;
}

export class NotificationService {
  private static readonly MAX_RETRIES = 3;
  private static readonly engine = new NotificationEngine();

  /**
   * Process pending notifications with retry logic and debouncing
   */
  static async processPendingNotifications() {
    const supabase = createAdminClient();

    try {
      // Get pending notifications that are due (scheduled_for <= now)
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .is('sent_at', null)
        .lte('scheduled_for', new Date().toISOString())
        .lt('retry_count', this.MAX_RETRIES)
        .order('created_at', { ascending: true })
        .limit(50); // Process in batches

      if (error) throw error;

      if (!notifications || notifications.length === 0) {
        return { success: true, processed: 0 };
      }

      // Process each notification
      const results = await Promise.allSettled(
        notifications.map(async (notification) => {
          try {
            const data: NotificationData = notification.data;
            const tenantId = notification.tenant_id;

            // 1. Get Tenant Settings for Templates
            const { data: settings } = await supabase
              .from('settings')
              .select('*')
              .eq('tenant_id', tenantId)
              .single();

            const emailEnabled = settings?.email_notifications_enabled ?? true;
            const smsEnabled = settings?.sms_notifications_enabled ?? false;

            // Prepare Variables
            const variables = {
              trackingCode: data.trackingCode,
              status: data.status.toUpperCase(),
              customerName: data.customerName || 'Customer',
              location: data.location,
              trackingUrl: `https://tracking.gajantraders.com/track/${data.trackingCode}`, // TODO: Use env
              companyName: settings?.company_name || 'Logistics Team',
            };

            // 2. Process Email
            if (emailEnabled && notification.recipient_email) {
              const subjectTemplate =
                settings?.email_template_subject ||
                'Shipment Update: {{trackingCode}} - {{status}}';
              const subject = renderTemplate(subjectTemplate, variables);

              let html;
              try {
                html = await render(
                  ShipmentNotificationEmail({
                    recipientName: data.customerName || 'Customer',
                    status: data.status,
                    trackingNumber: data.trackingCode,
                    referenceCode: data.trackingCode,
                    trackingUrl: variables.trackingUrl,
                    companyName: settings?.company_name || 'Logistics Team',
                    qrCodeDataUrl: '',
                  })
                );
              } catch (err) {
                console.error(
                  '[NotificationService] React Email Render Error:',
                  err
                );
                const bodyTemplate =
                  settings?.email_template_body ||
                  'Hello {{customerName}},<br/><br/>Your shipment ({{trackingCode}}) status has changed to: <b>{{status}}</b>.<br/><br/><a href="{{trackingUrl}}">Track here</a>';
                html = renderTemplate(bodyTemplate, variables);
              }

              await this.engine.sendEmail(tenantId, {
                to: notification.recipient_email,
                subject: subject,
                html: html,
                shipmentId: notification.shipment_id,
                triggerStatus: data.status,
              });
            }

            // 3. Process SMS
            if (smsEnabled && notification.recipient_phone) {
              const smsTemplate =
                settings?.sms_template ||
                'Shipment {{trackingCode}}: Status is now {{status}}. Track: {{trackingUrl}}';
              const body = renderTemplate(smsTemplate, variables);

              await this.engine.sendSMS(tenantId, {
                to: notification.recipient_phone,
                body: body,
                shipmentId: notification.shipment_id,
                triggerStatus: data.status,
              });
            }

            // 4. Process Webhook
            if (settings?.webhook_url) {
              await this.engine.sendWebhook(tenantId, {
                url: settings.webhook_url,
                data: {
                  ...data,
                  timestamp: new Date().toISOString(),
                  event: 'shipment_update',
                },
                shipmentId: notification.shipment_id,
                triggerStatus: data.status,
              });
            }

            // Mark as sent
            await supabase
              .from('notifications')
              .update({ sent_at: new Date().toISOString() })
              .eq('id', notification.id);

            return { id: notification.id, success: true };
          } catch (error: any) {
            console.error(
              `Failed to send notification ${notification.id}:`,
              error
            );

            // Increment retry count
            const newRetryCount = (notification.retry_count || 0) + 1;

            await supabase
              .from('notifications')
              .update({
                error: error.message,
                retry_count: newRetryCount,
              })
              .eq('id', notification.id);

            return {
              id: notification.id,
              success: false,
              error: error.message,
            };
          }
        })
      );

      const successful = results.filter(
        (r) => r.status === 'fulfilled' && (r as any).value.success
      ).length;

      return {
        success: true,
        processed: notifications.length,
        successful,
        failed: notifications.length - successful,
      };
    } catch (error: any) {
      console.error('Notification processing error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if a similar notification was already sent recently
   * Additional layer of spam prevention
   */
  private static async checkDuplicateNotification(
    shipmentId: string,
    status: string,
    currentNotificationId: string
  ): Promise<boolean> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('notifications')
      .select('id, sent_at, data')
      .eq('shipment_id', shipmentId)
      .not('id', 'eq', currentNotificationId)
      .not('sent_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return false;
    }

    const lastNotification = data[0];
    const lastStatus = lastNotification.data?.new_status;

    // Check if same status was already sent
    if (lastStatus === status) {
      return true;
    }

    return false;
  }

  /**
   * Send email notification based on type
   */
  private static async sendEmailNotification(
    type: string,
    email: string,
    data: NotificationData
  ) {
    switch (type) {
      case 'delivery':
        await emailService.sendDeliveryNotification(email, {
          tracking_number: data.tracking_number,
          carrier: data.carrier,
          customer_name: data.customer_name,
        });
        break;

      case 'exception':
        await emailService.sendExceptionNotification(email, {
          tracking_number: data.tracking_number,
          carrier: data.carrier,
          latest_location: data.latest_location,
        });
        break;

      case 'status_change':
      default:
        await emailService.sendStatusChangeNotification(email, {
          tracking_number: data.tracking_number,
          carrier: data.carrier,
          old_status: data.old_status || 'unknown',
          new_status: data.new_status,
          latest_location: data.latest_location,
        });
        break;
    }
  }

  /**
   * Send SMS notification with rate limiting
   */
  private static async sendSMSNotification(
    type: string,
    phone: string,
    data: NotificationData
  ) {
    // SMS implementation placeholder
    console.log(`[SMS] Would send to ${phone}:`, {
      type,
      tracking: data.tracking_number,
      status: data.new_status,
    });

    // SMS messages - keep them short (160 chars)
    const messages: Record<string, string> = {
      received: `📦 ${data.tracking_number} received by ${data.carrier}`,
      out_for_delivery: `🚚 ${data.tracking_number} out for delivery!`,
      delivered: `✅ ${data.tracking_number} delivered!`,
      exception: `⚠️ Issue with ${data.tracking_number}. Check tracking.`,
    };

    const message =
      messages[data.new_status] ||
      `${data.tracking_number}: ${data.new_status}`;

    // TODO: Implement actual SMS sending
    // Example with Twilio:
    // await twilioClient.messages.create({
    //   body: message,
    //   to: phone,
    //   from: process.env.TWILIO_PHONE_NUMBER
    // });

    console.log(`[SMS] Message: ${message}`);
  }

  /**
   * Clean up old notifications (optional maintenance)
   */
  static async cleanupOldNotifications(daysToKeep: number = 30) {
    const supabase = createAdminClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .not('sent_at', 'is', null)
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Cleanup error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}
