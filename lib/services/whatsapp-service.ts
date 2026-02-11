/** @format */

import { logger } from '../logger';
import { createAdminClient } from '../supabase/admin';

export interface WhatsAppOptions {
  to: string;
  templateName: string;
  variables: Record<string, string>;
  language?: string;
}

export class WhatsAppService {
  private baseUrl =
    'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/custom/';

  /**
   * Send a WhatsApp message using MSG91
   */
  async sendWhatsApp(
    tenantId: string,
    options: WhatsAppOptions,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // 1. Get Tenant Config
      const supabase = createAdminClient();
      const { data: config } = await supabase
        .from('tenant_notification_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('channel', 'whatsapp')
        .eq('is_active', true)
        .single();

      let apiKey = process.env.MSG91_API_KEY;
      let integratedNumber = process.env.MSG91_INTEGRATED_NUMBER;

      if (config && config.provider_id === 'msg91') {
        apiKey = config.credentials?.api_key || apiKey;
        integratedNumber =
          config.credentials?.integrated_number || integratedNumber;
      }

      if (!apiKey || !integratedNumber) {
        logger.warn('No active WhatsApp configuration found (MSG91)', {
          tenantId,
        });
        return { success: false, error: 'WhatsApp configuration missing' };
      }

      // 2. Prepare Payload for MSG91
      // Note: MSG91 structure varies by template type. This is a generic implementation.
      const payload = {
        integrated_number: integratedNumber,
        content_type: 'template',
        payload: {
          to: options.to,
          type: 'template',
          template: {
            name: options.templateName,
            language: {
              code: options.language || 'en',
              policy: 'deterministic',
            },
            to_and_components: [
              {
                to: [options.to],
                components: this.mapVariablesToComponents(
                  options.variables,
                  options.templateName,
                ),
              },
            ],
          },
        },
      };

      // 3. Send Request
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.type === 'error') {
        throw new Error(data.message || 'MSG91 API Error');
      }

      return { success: true, messageId: data.message_id };
    } catch (error: any) {
      logger.error('WhatsApp send failed', {
        error: error.message,
        tenantId,
        to: options.to,
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Maps detailed payload to MSG91 component structure based on template rules
   */
  private mapVariablesToComponents(
    variables: Record<string, string>,
    templateName: string,
  ) {
    // Standard Mappings for known templates
    // MSG91 templates usually use {{1}}, {{2}} etc.
    // We map our named variables to these indices.

    let orderedValues: string[] = [];

    if (
      templateName === 'shipment_status' ||
      templateName === 'shipment_update'
    ) {
      // Template: "Hello {{1}}, your shipment {{2}} is now {{3}}. Track here: {{4}}"
      orderedValues = [
        variables.customer_name || 'Customer',
        variables.tracking_code || 'Unknown',
        variables.new_status || 'Updated',
        `https://gajantraders.com/track/${variables.white_label_code || variables.tracking_code}`,
      ];
    } else if (templateName === 'shipment_delivered') {
      // Template: "Hi {{1}}, shipment {{2}} has been delivered."
      orderedValues = [
        variables.customer_name || 'Customer',
        variables.tracking_code || 'Unknown',
      ];
    } else {
      // Fallback: Just dump values if unknown template
      orderedValues = Object.values(variables).map(String);
    }

    const parameters = orderedValues.map((val) => ({
      type: 'text',
      text: String(val),
    }));

    return {
      body: parameters,
    };
  }
}

export const whatsappService = new WhatsAppService();
