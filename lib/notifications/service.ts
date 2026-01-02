
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
   */
  async notifyStatusChange(payload: NotificationPayload) {
    console.log(`[NotificationService] Processing update for ${payload.trackingCode}: ${payload.oldStatus} -> ${payload.status}`);
    
    // 1. Get Tenant & Settings (for Triggers & Templates)
    const { data: shipment } = await this.client
        .from('shipments')
        .select('tenant_id')
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
    const triggers = settings?.notification_triggers || ["delivered", "exception", "out_for_delivery", "failed"];
    
    // Check Status Trigger
    const shouldNotify = triggers.includes(payload.status) || triggers.includes('all');
    if (!shouldNotify) {
        console.log(`[NotificationService] Status '${payload.status}' not in triggers. Skipping.`);
        return;
    }

    const emailEnabled = settings?.email_notifications_enabled ?? true;
    const smsEnabled = settings?.sms_notifications_enabled ?? false;

    // Prepare Variables
    const variables = {
        trackingCode: payload.trackingCode,
        status: payload.status.toUpperCase(),
        customerName: payload.customerName || 'Customer',
        location: payload.location,
        trackingUrl: `http://localhost:3000/track/${payload.trackingCode}`, // TODO: Use env
        companyName: settings?.company_name || 'Logistics Team'
    };

    // 2. Send Email via Engine
    if (emailEnabled && payload.customerEmail) {
        // Generate Header Logic (Subject)
        const subjectTemplate = settings?.email_template_subject || 'Shipment Update: {{trackingCode}} - {{status}}';
        const subject = renderTemplate(subjectTemplate, variables);

        // Generate Body Logic (Use React Email)
        let html;
        try {
            html = await render(
               ShipmentNotificationEmail({
                  recipientName: payload.customerName || 'Customer',
                  status: payload.status,
                  trackingNumber: payload.trackingCode,
                  referenceCode: payload.trackingCode,
                  trackingUrl: variables.trackingUrl,
                  companyName: settings?.company_name || 'Logistics Team',
                  qrCodeDataUrl: '' // We can generate this if needed, or leave empty
               })
            );
        } catch (err) {
            console.error('[NotificationService] React Email Render Error:', err);
            // Fallback to basic template
             const bodyTemplate = settings?.email_template_body || 'Hello {{customerName}},<br/><br/>Your shipment ({{trackingCode}}) status has changed to: <b>{{status}}</b>.<br/><br/><a href="{{trackingUrl}}">Track here</a><br/><br/>Regards,<br/>{{companyName}}';
             html = renderTemplate(bodyTemplate, variables);
        }

        await this.engine.sendEmail(shipment.tenant_id, {
            to: payload.customerEmail,
            subject: subject,
            html: html,
            text: html.replace(/<[^>]*>?/gm, ''), // Simple strip tags
            shipmentId: payload.shipmentId,
            triggerStatus: payload.status
        });
    }

    // 3. Send SMS via Engine
    if (smsEnabled && payload.customerPhone) {
        const smsTemplate = settings?.sms_template || 'Shipment {{trackingCode}}: Status is now {{status}}. Track: {{trackingUrl}}';
        const body = renderTemplate(smsTemplate, variables);

        await this.engine.sendSMS(shipment.tenant_id, {
            to: payload.customerPhone,
            body: body,
            shipmentId: payload.shipmentId,
            triggerStatus: payload.status
        });
    }

    // 4. Send Webhook via Engine
    if (settings?.webhook_url) {
        await this.engine.sendWebhook(shipment.tenant_id, {
            url: settings.webhook_url,
            data: {
                ...payload,
                timestamp: new Date().toISOString(),
                event: 'shipment_update'
            },
            shipmentId: payload.shipmentId,
            triggerStatus: payload.status
        });
    }
  }
}
