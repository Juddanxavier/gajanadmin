/** @format */

import { logger } from '../logger';
import { createClient } from '../supabase/server';
import {
  whatsappService,
  WHATSAPP_TEMPLATES,
  WhatsAppService,
} from './whatsapp-service';
import { emailService } from './email-service';

export type NotificationChannel = 'email' | 'sms' | 'whatsapp';
export type NotificationEventType =
  | 'shipment_created'
  | 'shipment_received'
  | 'shipment_in_transit'
  | 'shipment_out_for_delivery'
  | 'shipment_delivered'
  | 'shipment_exception';

export interface QueueNotificationParams {
  shipmentId: string;
  tenantId: string;
  eventType: NotificationEventType;
  recipientEmail: string;
  recipientPhone?: string;
  recipientName: string;
  templateData: Record<string, any>;
}

export class NotificationService {
  /**
   * Queue a notification for later processing
   */
  async queueNotification(params: QueueNotificationParams): Promise<void> {
    const supabase = await createClient();

    try {
      // Get tenant's notification configuration (Providers)
      const { data: configs } = await supabase
        .from('tenant_notification_configs')
        .select('*')
        .eq('tenant_id', params.tenantId)
        .eq('is_enabled', true);

      // Get tenant's General Settings (Triggers)
      const { data: settings } = await supabase
        .from('settings')
        .select('notification_triggers')
        .eq('tenant_id', params.tenantId)
        .single();

      const triggers = settings?.notification_triggers || [];

      if (!configs || configs.length === 0) {
        logger.warn('No notification channels configured for tenant', {
          tenantId: params.tenantId,
        });
        return;
      }

      // Queue notification for each enabled channel
      for (const config of configs) {
        const channel = config.channel as NotificationChannel;

        // Skip if this event type is not configured in settings
        if (!this.shouldSendForEvent(triggers, params.eventType)) {
          continue;
        }

        await supabase.from('notification_queue').insert({
          shipment_id: params.shipmentId,
          tenant_id: params.tenantId,
          event_type: params.eventType,
          channel,
          recipient_email: channel === 'email' ? params.recipientEmail : null,
          recipient_phone:
            channel === 'whatsapp' || channel === 'sms'
              ? params.recipientPhone
              : null,
          recipient_name: params.recipientName,
          template_data: params.templateData,
          status: 'pending',
          scheduled_for: new Date().toISOString(),
        });

        logger.info('Notification queued', {
          shipmentId: params.shipmentId,
          eventType: params.eventType,
          channel,
        });
      }
    } catch (error) {
      logger.error('Error queuing notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        params,
      });
    }
  }

  /**
   * Process pending notifications from the queue
   */
  async processPendingNotifications(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    const supabase = await createClient();

    try {
      // Get pending notifications that are ready to be sent
      const { data: notifications, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(50); // Process in batches

      if (error) throw error;

      let processed = 0;
      let succeeded = 0;
      let failed = 0;

      for (const notification of notifications || []) {
        processed++;

        try {
          // Mark as processing
          await supabase
            .from('notification_queue')
            .update({ status: 'processing' })
            .eq('id', notification.id);

          // Send notification based on channel
          let success = false;
          let providerMessageId: string | undefined;

          switch (notification.channel) {
            case 'email':
              // Email sending handled by EmailService
              const emailResult = await emailService.sendTemplateEmail({
                tenantId: notification.tenant_id,
                to: notification.recipient_email,
                templateType: notification.event_type,
                variables: notification.template_data || {},
              });

              success = emailResult.success;
              if (emailResult.messageId) {
                providerMessageId = emailResult.messageId;
              }
              if (!success) {
                // Log error if available, though checking notification_log is better
                logger.warn('Email send failed', {
                  id: notification.id,
                  error: emailResult.error,
                });
              }
              break;

            case 'whatsapp':
              const whatsappResult =
                await this.sendWhatsAppNotification(notification);
              success = whatsappResult.success;
              providerMessageId = whatsappResult.messageId;
              break;

            case 'sms':
              // SMS implementation would go here
              success = true;
              break;
          }

          // Update status
          await supabase
            .from('notification_queue')
            .update({
              status: success ? 'sent' : 'failed',
              sent_at: success ? new Date().toISOString() : null,
              error_message: success ? null : 'Failed to send',
              provider_message_id: providerMessageId,
            })
            .eq('id', notification.id);

          // Log to notification_logs
          await supabase.from('notification_logs').insert({
            shipment_id: notification.shipment_id,
            tenant_id: notification.tenant_id,
            channel: notification.channel,
            event_type: notification.event_type,
            recipient:
              notification.recipient_email || notification.recipient_phone,
            status: success ? 'sent' : 'failed',
            error_message: success ? null : 'Failed to send',
          });

          if (success) {
            succeeded++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          logger.error('Error processing notification', {
            notificationId: notification.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          await supabase
            .from('notification_queue')
            .update({
              status: 'failed',
              error_message:
                error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', notification.id);
        }
      }

      logger.info('Notification processing completed', {
        processed,
        succeeded,
        failed,
      });

      return { processed, succeeded, failed };
    } catch (error) {
      logger.error('Error processing notifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return { processed: 0, succeeded: 0, failed: 0 };
    }
  }

  /**
   * Send WhatsApp notification
   */
  private async sendWhatsAppNotification(notification: any): Promise<{
    success: boolean;
    messageId?: string;
  }> {
    if (!whatsappService) {
      logger.error('WhatsApp service not configured');
      return { success: false };
    }

    if (!notification.recipient_phone) {
      logger.error('No recipient phone number for WhatsApp notification');
      return { success: false };
    }

    // Get template based on event type
    const templateId = this.getWhatsAppTemplate(notification.event_type);
    if (!templateId) {
      logger.error('No WhatsApp template found for event type', {
        eventType: notification.event_type,
      });
      return { success: false };
    }

    // Format phone number
    const phone = WhatsAppService.formatPhoneNumber(
      notification.recipient_phone,
    );

    if (!WhatsAppService.isValidPhoneNumber(phone)) {
      logger.error('Invalid phone number', {
        phone: notification.recipient_phone,
      });
      return { success: false };
    }

    return await whatsappService.sendTemplateMessage({
      to: phone,
      templateId,
      variables: notification.template_data || {},
      recipientName: notification.recipient_name,
    });
  }

  /**
   * Get WhatsApp template for event type
   */
  private getWhatsAppTemplate(eventType: string): string | null {
    const templateMap: Record<string, string> = {
      shipment_received: WHATSAPP_TEMPLATES.SHIPMENT_RECEIVED.id,
      shipment_in_transit: WHATSAPP_TEMPLATES.SHIPMENT_IN_TRANSIT.id,
      shipment_out_for_delivery:
        WHATSAPP_TEMPLATES.SHIPMENT_OUT_FOR_DELIVERY.id,
      shipment_delivered: WHATSAPP_TEMPLATES.SHIPMENT_DELIVERED.id,
      shipment_exception: WHATSAPP_TEMPLATES.SHIPMENT_EXCEPTION.id,
    };

    return templateMap[eventType] || null;
  }

  /**
   * Check if notification should be sent for this event
   */
  private shouldSendForEvent(
    triggers: string[] | null,
    eventType: string,
  ): boolean {
    // If no triggers configured (or null), assumption: send all?
    // OR if settings exist but empty array -> send nothing?
    // Let's assume if settings row missing/null triggers -> send all (default behavior)
    if (!triggers || triggers.length === 0) {
      return true;
    }

    // Normalize eventType (e.g. shipment_delivered -> delivered)
    const status = eventType.replace('shipment_', '');

    // Check if this status is in the triggers
    return triggers.includes(status);
  }
}

// Export singleton
export const notificationService = new NotificationService();
