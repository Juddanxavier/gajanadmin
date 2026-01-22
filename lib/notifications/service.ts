/** @format */

import { render } from '@react-email/render';
import ShipmentNotificationEmail from '@/emails/shipment-notification';
import { createAdminClient } from '@/lib/supabase/admin';
import { renderTemplate } from './template-engine';
import { NotificationEngine } from './engine';

export interface NotificationPayload {
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
  private client;
  private engine: NotificationEngine;

  constructor() {
    this.client = createAdminClient();
    this.engine = new NotificationEngine();
  }

  /**
   * Send notification for status change.
   * Implements a 30-second debounce period.
   */
  async notifyStatusChange(payload: NotificationPayload) {
    console.log(
      `[NotificationService] Debouncing update for ${payload.trackingCode}: ${payload.oldStatus} -> ${payload.status}`,
    );

    // 1. Get Tenant & Settings (for Triggers)
    const { data: shipment } = await this.client
      .from('shipments')
      .select('tenant_id, customer_details')
      .eq('id', payload.shipmentId)
      .single();

    if (!shipment) {
      console.error('[NotificationService] Shipment not found');
      return;
    }

    const { data: settings } = await this.client
      .from('settings')
      .select('*')
      .eq('tenant_id', shipment.tenant_id)
      .single();

    // Default triggers
    const triggers = settings?.notification_triggers || [
      'pending',
      'info_received',
      'delivered',
      'exception',
      'out_for_delivery',
      'failed',
    ];

    // Check Status Trigger
    const shouldNotify =
      triggers.includes(payload.status) || triggers.includes('all');
    if (!shouldNotify) {
      console.log(
        `[NotificationService] Status '${payload.status}' not in triggers. Skipping.`,
      );
      return;
    }

    // Upsert into notifications table for debouncing
    // If a record for this shipment already exists and hasn't been sent, we update its status and push back the schedule.
    const scheduledFor = new Date(Date.now() + 30 * 1000).toISOString();

    const { data: existingQueue } = await this.client
      .from('notifications')
      .select('id')
      .eq('shipment_id', payload.shipmentId)
      .is('sent_at', null)
      .maybeSingle();

    if (existingQueue) {
      await this.client
        .from('notifications')
        .update({
          type: 'status_change',
          data: {
            ...payload,
            updated_at: new Date().toISOString(),
          },
          scheduled_for: scheduledFor,
          retry_count: 0, // Reset retries on new update
        })
        .eq('id', existingQueue.id);
      console.log(
        `[NotificationService] Updated existing queue item ${existingQueue.id}. New schedule: ${scheduledFor}`,
      );
    } else {
      await this.client.from('notifications').insert({
        shipment_id: payload.shipmentId,
        tenant_id: shipment.tenant_id,
        recipient_email:
          payload.customerEmail || shipment.customer_details?.email,
        recipient_phone:
          payload.customerPhone || shipment.customer_details?.phone,
        type: 'status_change',
        data: payload,
        scheduled_for: scheduledFor,
      });
      console.log(
        `[NotificationService] Created new queue item. Schedule: ${scheduledFor}`,
      );
    }
  }
}
