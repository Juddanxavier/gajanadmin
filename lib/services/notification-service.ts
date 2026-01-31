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

    // 2. Send WhatsApp (Priority over SMS)
    if (payload.recipientPhone) {
      console.log(
        `[NotificationService] Dispatching WhatsApp for ${payload.trackingCode}`,
      );
      try {
        const res = await this.whatsappService.sendShipmentNotification({
          shipmentId: payload.shipmentId,
          tenantId: payload.tenantId,
          recipientPhone: payload.recipientPhone,
          recipientName: payload.recipientName || 'Customer',
          trackingCode: payload.trackingCode,
          status: payload.status,
          location: payload.location,
          updatedAt: payload.updatedAt,
          tenantName: payload.tenantName,
          carrier: payload.carrier,
        });
        results.whatsapp = { success: res.success, message: res.message };
      } catch (error: any) {
        console.error('[NotificationService] WhatsApp Failed:', error);
        results.whatsapp = { success: false, error: error.message };
      }
    }

    return results;
  }
}
