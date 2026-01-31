/** @format */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

interface SendWhatsAppParams {
  shipmentId: string;
  tenantId: string;
  recipientPhone: string;
  recipientName: string;
  trackingCode: string;
  status: string;
  message?: string;
  templateParams?: Record<string, string>;
}

interface WhatsAppConfig {
  provider_id: string;
  credentials: {
    auth_key?: string; // MSG91
    account_sid?: string; // Twilio
    auth_token?: string; // Twilio
    phone_number_id?: string; // Meta
  };
  config: {
    sender_id?: string; // MSG91
    from_number?: string; // Twilio
  };
  is_active: boolean;
}

export class WhatsAppService {
  private supabase: Awaited<ReturnType<typeof createClient>>;

  constructor(supabase: Awaited<ReturnType<typeof createClient>>) {
    this.supabase = supabase;
  }

  /**
   * Send WhatsApp notification
   */
  async sendShipmentNotification(params: SendWhatsAppParams): Promise<{
    success: boolean;
    message: string;
    logId?: string;
  }> {
    const { tenantId, recipientPhone, status } = params;

    try {
      // 1. Get Tenant Config
      const config = await this.getTenantWhatsAppConfig(tenantId);

      if (!config) {
        console.warn(
          `[WhatsApp] No active configuration for tenant ${tenantId}`,
        );
        return { success: false, message: 'No WhatsApp configuration' };
      }

      // 2. Mock/Placeholder Send Logic
      let result = { success: false, message: 'Provider not implemented' };

      if (config.provider_id === 'msg91') {
        result = await this.sendViaMSG91(config, params);
      } else if (config.provider_id === 'generic_whatsapp') {
        result = await this.sendViaGenericMock(config, params);
      } else {
        console.warn(`[WhatsApp] Unknown provider: ${config.provider_id}`);
      }

      // 3. Log Result
      const logId = await this.logAttempt({
        ...params,
        status: result.success ? 'sent' : 'failed',
        errorMessage: result.success ? undefined : result.message,
        providerId: config.provider_id,
      });

      return { ...result, logId };
    } catch (error: any) {
      console.error('[WhatsApp] Send failed:', error);
      await this.logAttempt({
        ...params,
        status: 'failed',
        errorMessage: error.message,
        providerId: 'unknown',
      });
      return { success: false, message: error.message };
    }
  }

  /**
   * Get tenant WhatsApp configuration
   */
  private async getTenantWhatsAppConfig(
    tenantId: string,
  ): Promise<WhatsAppConfig | null> {
    const { data, error } = await this.supabase
      .from('tenant_notification_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('channel', 'whatsapp')
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data as WhatsAppConfig;
  }

  /**
   * Mock MSG91 Sender (Placeholder)
   */
  private async sendViaMSG91(
    config: WhatsAppConfig,
    params: SendWhatsAppParams,
  ) {
    console.log('📱 [MSG91-MOCK] Sending WhatsApp...');
    console.log(`   To: ${params.recipientPhone}`);
    console.log(`   Template: shipment_${params.status}`);
    console.log(
      `   Auth Key: ${config.credentials.auth_key ? '***' : 'Missing'}`,
    );

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500));

    return {
      success: true,
      message: 'Mock MSG91 message sent (Placeholder)',
    };
  }

  /**
   * Generic/Console Sender
   */
  private async sendViaGenericMock(
    config: WhatsAppConfig,
    params: SendWhatsAppParams,
  ) {
    console.log('📱 [WHATSAPP-MOCK] Sending to ' + params.recipientPhone);
    return { success: true, message: 'Mock WhatsApp sent' };
  }

  /**
   * Log attempt
   */
  private async logAttempt(
    params: SendWhatsAppParams & {
      status: 'sent' | 'failed';
      errorMessage?: string;
      providerId: string;
    },
  ) {
    const { data } = await this.supabase
      .from('notification_logs')
      .insert({
        tenant_id: params.tenantId,
        shipment_id: params.shipmentId,
        type: 'whatsapp', // Make sure this matches DB enum/text constraint
        recipient: params.recipientPhone,
        subject: `WhatsApp: ${params.status}`,
        body: `Provider: ${params.providerId}`,
        status: params.status,
        error_message: params.errorMessage,
        sent_at: params.status === 'sent' ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    return data?.id;
  }
}
