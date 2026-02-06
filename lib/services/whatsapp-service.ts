/** @format */

import { logger } from '../logger';

export interface WhatsAppConfig {
  authKey: string;
  senderId?: string;
}

export interface WhatsAppMessage {
  to: string; // Phone number with country code (e.g., 919876543210)
  templateId: string;
  variables: Record<string, string>;
  recipientName?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * MSG91 WhatsApp Service
 * Documentation: https://docs.msg91.com/p/tf9GTextGo9G96DYtBv54w/e/Lhd7sEgNYo6jqLaQ7mTrXKZ Rz/MSG91-WhatsApp-API
 */
export class WhatsAppService {
  private authKey: string;
  private senderId: string;
  private baseUrl: string = 'https://api.msg91.com/api/v5';

  constructor(config: WhatsAppConfig) {
    this.authKey = config.authKey;
    this.senderId = config.senderId || 'MSG91';
  }

  /**
   * Send WhatsApp template message via MSG91
   */
  async sendTemplateMessage(
    message: WhatsAppMessage,
  ): Promise<WhatsAppResponse> {
    try {
      logger.info('Sending WhatsApp message', {
        to: message.to,
        templateId: message.templateId,
      });

      const response = await fetch(
        `${this.baseUrl}/whatsapp/whatsapp-outbound-message/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authkey: this.authKey,
          },
          body: JSON.stringify({
            integrated_number: this.senderId,
            content_type: 'template',
            payload: {
              to: message.to,
              type: 'template',
              template: {
                name: message.templateId,
                language: {
                  code: 'en',
                  policy: 'deterministic',
                },
                components: this.buildTemplateComponents(message.variables),
              },
            },
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send WhatsApp message');
      }

      logger.info('WhatsApp message sent successfully', {
        to: message.to,
        messageId: data.data?.id,
      });

      return {
        success: true,
        messageId: data.data?.id,
      };
    } catch (error) {
      logger.error('Error sending WhatsApp message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: message.to,
      });

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send WhatsApp message',
      };
    }
  }

  /**
   * Build template components from variables
   */
  private buildTemplateComponents(variables: Record<string, string>): any[] {
    const parameters = Object.entries(variables).map(([key, value]) => ({
      type: 'text',
      text: value,
    }));

    return [
      {
        type: 'body',
        parameters,
      },
    ];
  }

  /**
   * Format phone number for MSG91
   * Removes spaces, dashes, and plus sign
   */
  static formatPhoneNumber(phone: string): string {
    return phone.replace(/[\s\-\+]/g, '');
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phone: string): boolean {
    // Should be 10-15 digits
    const cleaned = WhatsAppService.formatPhoneNumber(phone);
    return /^\d{10,15}$/.test(cleaned);
  }
}

// Singleton instance
export const whatsappService = process.env.MSG91_AUTH_KEY
  ? new WhatsAppService({
      authKey: process.env.MSG91_AUTH_KEY,
      senderId: process.env.MSG91_SENDER_ID,
    })
  : null;

/**
 * WhatsApp Message Templates
 * These should match the templates configured in MSG91 dashboard
 */
export const WHATSAPP_TEMPLATES = {
  SHIPMENT_RECEIVED: {
    id: 'shipment_received',
    variables: ['customerName', 'trackingCode', 'carrier'],
  },
  SHIPMENT_IN_TRANSIT: {
    id: 'shipment_in_transit',
    variables: ['customerName', 'trackingCode', 'location'],
  },
  SHIPMENT_OUT_FOR_DELIVERY: {
    id: 'shipment_out_for_delivery',
    variables: ['customerName', 'trackingCode', 'estimatedDelivery'],
  },
  SHIPMENT_DELIVERED: {
    id: 'shipment_delivered',
    variables: ['customerName', 'trackingCode', 'deliveryDate'],
  },
  SHIPMENT_EXCEPTION: {
    id: 'shipment_exception',
    variables: ['customerName', 'trackingCode', 'exceptionReason'],
  },
};
