/** @format */

import { SupabaseClient } from '@supabase/supabase-js';
import { EmailService } from './email-notification-service';
import { WhatsAppService } from './whatsapp-notification-service';

export interface NotificationPayload {
  shipmentId: string;
  tenantId: string;
  status: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  trackingCode: string;
  referenceCode: string;
  invoiceAmount?: number;
  invoiceCurrency?: string;
  deliveryDate?: string;
  // Extended fields for WhatsApp/Templates
  location?: string;
  updatedAt?: string;
  tenantName?: string;
  carrier?: string;
}

export type NotificationResult = {
  success: boolean;
  message?: string;
  error?: string;
  skipped?: boolean;
};

export class NotificationService {
  private emailService: EmailService;
  private whatsappService: WhatsAppService;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.emailService = new EmailService(supabase as any);
    this.whatsappService = new WhatsAppService(supabase as any);
  }

  /**
   * Orchestrates sending notifications across all enabled channels
   * Enqueues notifications to be processed by the background worker
   */
  async sendNotifications(payload: NotificationPayload) {
    const results: Record<string, NotificationResult> = {};

    // Fetch Settings
    const { data: settings } = await this.supabase
      .from('settings')
      .select('notification_triggers, email_notifications_enabled')
      .eq('tenant_id', payload.tenantId)
      .single();

    const allowedTriggers: string[] = settings?.notification_triggers || [
      'delivered',
      'exception',
      'out_for_delivery',
    ];
    const isEmailEnabled = settings?.email_notifications_enabled !== false;

    // Check if status is allowed
    // Handle 'created' status which might map to 'pending' or be explicit
    const status = payload.status === 'created' ? 'pending' : payload.status;

    // Explicit check for "all" or specific status
    const isTriggerAllowed =
      allowedTriggers.includes('all') || allowedTriggers.includes(status);

    // IDEMPOTENCY CHECK
    // Prevent duplicate emails for the same event within 5 minutes (e.g. from flaky webhooks)
    if (isTriggerAllowed) {
      const { data: recent } = await this.supabase
        .from('notification_queue')
        .select('id')
        .eq('shipment_id', payload.shipmentId)
        .eq('event_type', payload.status)
        .gt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .limit(1);

      if (recent && recent.length > 0) {
        console.warn(
          `[NotificationService] Duplicate notification suppressed for ${payload.shipmentId} / ${payload.status}`,
        );
        return {
          email: {
            success: false,
            skipped: true,
            message: 'Duplicate suppressed (Idempotency)',
          },
          whatsapp: {
            success: false,
            skipped: true,
            message: 'Duplicate suppressed (Idempotency)',
          },
        };
      }
    }

    // 1. Queue Email
    if (payload.recipientEmail) {
      if (isEmailEnabled && isTriggerAllowed) {
        console.log(
          `[NotificationService] Queuing Email for ${payload.trackingCode}`,
        );
        const { error } = await this.supabase
          .from('notification_queue')
          .insert({
            shipment_id: payload.shipmentId,
            tenant_id: payload.tenantId,
            event_type: payload.status,
            channel: 'email',
            status: 'pending',
            metadata: payload,
          });

        if (error) {
          console.error('[NotificationService] Failed to queue email:', error);
          results.email = {
            success: false,
            error: 'Queue Insert Failed: ' + error.message,
          };
        } else {
          results.email = { success: true, message: 'Queued' };
        }
      } else {
        results.email = {
          success: false,
          skipped: true,
          message: !isEmailEnabled
            ? 'Email disabled'
            : !isTriggerAllowed
              ? 'Trigger disabled'
              : 'No email provided',
        };
      }
    } else {
      results.email = {
        success: false,
        skipped: true,
        message: 'No email provided',
      };
    }

    // 2. Queue WhatsApp
    if (payload.recipientPhone) {
      if (isTriggerAllowed) {
        console.log(
          `[NotificationService] Queuing WhatsApp for ${payload.trackingCode}`,
        );
        const { error } = await this.supabase
          .from('notification_queue')
          .insert({
            shipment_id: payload.shipmentId,
            tenant_id: payload.tenantId,
            event_type: payload.status,
            channel: 'whatsapp',
            status: 'pending',
            metadata: payload,
          });

        if (error) {
          console.error(
            '[NotificationService] Failed to queue whatsapp:',
            error,
          );
          results.whatsapp = {
            success: false,
            error: 'Queue Insert Failed: ' + error.message,
          };
        } else {
          results.whatsapp = { success: true, message: 'Queued' };
        }
      } else {
        results.whatsapp = {
          success: false,
          skipped: true,
          message: 'Trigger disabled',
        };
      }
    }

    return results;
  }

  /**
   * Process a single queue item (Called by Cron API)
   */
  async processQueueItem(
    item: any,
  ): Promise<{ success: boolean; error?: string }> {
    const payload = item.metadata as NotificationPayload;

    try {
      if (item.channel === 'email') {
        const res = await this.emailService.sendShipmentNotification({
          shipmentId: payload.shipmentId,
          tenantId: payload.tenantId,
          status: payload.status,
          recipientEmail: payload.recipientEmail!,
          recipientName: payload.recipientName || 'Customer',
          trackingCode: payload.trackingCode,
          referenceCode: payload.referenceCode,
          invoiceAmount: payload.invoiceAmount,
          invoiceCurrency: payload.invoiceCurrency,
          deliveryDate: payload.deliveryDate,
        });
        return { success: res.success, error: res.message };
      } else if (item.channel === 'whatsapp') {
        const res = await this.whatsappService.sendShipmentNotification({
          shipmentId: payload.shipmentId,
          tenantId: payload.tenantId,
          recipientPhone: payload.recipientPhone!,
          recipientName: payload.recipientName || 'Customer',
          trackingCode: payload.trackingCode,
          status: payload.status,
          location: payload.location,
          updatedAt: payload.updatedAt,
          tenantName: payload.tenantName,
          carrier: payload.carrier,
        });
        return { success: res.success, error: res.message };
      }
      return { success: false, error: 'Unknown channel' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
