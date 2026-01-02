import { createAdminClient } from '@/lib/supabase/admin';
import { emailService } from './email-service';

/**
 * Notification Service with Anti-Spam Protection
 * Processes queued notifications and sends emails/SMS
 */

interface NotificationData {
  tracking_number: string;
  carrier: string;
  old_status?: string;
  new_status: string;
  latest_location?: string;
  customer_name?: string;
}

export class NotificationService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MINUTES = 5;

  /**
   * Process pending notifications with retry logic
   */
  static async processPendingNotifications() {
    const supabase = createAdminClient();

    try {
      // Get pending notifications (not sent and retry count < max)
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .is('sent_at', null)
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

            // Additional spam check: verify this isn't a duplicate
            const isDuplicate = await this.checkDuplicateNotification(
              notification.shipment_id,
              data.new_status,
              notification.id
            );

            if (isDuplicate) {
              console.log(`[Anti-Spam] Skipping duplicate notification ${notification.id}`);
              // Mark as sent to prevent reprocessing
              await supabase
                .from('notifications')
                .update({ 
                  sent_at: new Date().toISOString(),
                  error: 'Duplicate notification skipped'
                })
                .eq('id', notification.id);
              return { id: notification.id, success: true, skipped: true };
            }

            // Send email if recipient_email exists
            if (notification.recipient_email) {
              await this.sendEmailNotification(
                notification.type,
                notification.recipient_email,
                data
              );
            }

            // Send SMS if recipient_phone exists
            if (notification.recipient_phone) {
              await this.sendSMSNotification(
                notification.type,
                notification.recipient_phone,
                data
              );
            }

            // Mark as sent
            await supabase
              .from('notifications')
              .update({ sent_at: new Date().toISOString() })
              .eq('id', notification.id);

            return { id: notification.id, success: true };
          } catch (error: any) {
            console.error(`Failed to send notification ${notification.id}:`, error);

            // Increment retry count
            const newRetryCount = (notification.retry_count || 0) + 1;

            await supabase
              .from('notifications')
              .update({ 
                error: error.message,
                retry_count: newRetryCount
              })
              .eq('id', notification.id);

            return { id: notification.id, success: false, error: error.message };
          }
        })
      );

      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;
      const skipped = results.filter(
        (r) => r.status === 'fulfilled' && r.value.skipped
      ).length;

      return {
        success: true,
        processed: notifications.length,
        successful,
        skipped,
        failed: notifications.length - successful - skipped,
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

    const message = messages[data.new_status] || `${data.tracking_number}: ${data.new_status}`;

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
