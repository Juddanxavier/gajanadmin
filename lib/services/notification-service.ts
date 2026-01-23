/** @format */

import { SupabaseClient } from '@supabase/supabase-js';
import { EmailService } from './email-notification-service';

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
}

export type NotificationResult = {
  success: boolean;
  message?: string;
  error?: string;
  skipped?: boolean;
};

export class NotificationService {
  private emailService: EmailService;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.emailService = new EmailService(supabase as any);
  }

  /**
   * Orchestrates sending notifications across all enabled channels
   */
  async sendNotifications(payload: NotificationPayload) {
    const results: Record<string, NotificationResult> = {};

    // 1. Send Email (if eligible)
    if (payload.recipientEmail) {
      console.log(
        `[NotificationService] Dispatching Email for ${payload.trackingCode}`,
      );
      try {
        const res = await this.emailService.sendShipmentNotification({
          shipmentId: payload.shipmentId,
          tenantId: payload.tenantId,
          status: payload.status,
          recipientEmail: payload.recipientEmail,
          recipientName: payload.recipientName || 'Customer',
          trackingCode: payload.trackingCode,
          referenceCode: payload.referenceCode,
          invoiceAmount: payload.invoiceAmount,
          invoiceCurrency: payload.invoiceCurrency,
          deliveryDate: payload.deliveryDate,
        });
        results.email = { success: res.success, message: res.message };
      } catch (error: any) {
        console.error('[NotificationService] Email Failed:', error);
        results.email = { success: false, error: error.message };
      }
    } else {
      results.email = {
        success: false,
        skipped: true,
        message: 'No email provided',
      };
    }

    // 2. Send WhatsApp (Stub)
    if (payload.recipientPhone) {
      // console.log(`[NotificationService] Dispatching WhatsApp for ${payload.trackingCode}`);
      // TODO: Implement WhatsApp Service
      results.whatsapp = {
        success: false,
        skipped: true,
        message: 'WhatsApp provider not implemented',
      };
    } else {
      results.whatsapp = {
        success: false,
        skipped: true,
        message: 'No phone provided',
      };
    }

    return results;
  }
}
