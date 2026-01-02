
// Notification Engine Logic
// c:\websites\kajen\gajan\admin\lib\notifications\engine.ts

import { createAdminClient } from '@/lib/supabase/admin';
import { IEmailProvider, ISMSProvider, ProviderConfig } from './providers/base';
import { SMTPProvider } from './providers/smtp';
import { TwilioProvider } from './providers/twilio';
// We will add Zepto/Resend imports here later

import { ZeptoMailProvider } from './providers/zeptomail';

export class NotificationFactory {
    static getEmailProvider(config: ProviderConfig): IEmailProvider {
        switch (config.providerId) {
            case 'smtp':
                return new SMTPProvider(config);
            case 'resend':
                throw new Error('Resend provider not yet implemented');
            case 'zeptomail':
                return new ZeptoMailProvider(config);
            default:
                throw new Error(`Unknown email provider: ${config.providerId}`);
        }
    }

    static getSMSProvider(config: ProviderConfig): ISMSProvider {
        switch (config.providerId) {
            case 'twilio':
                return new TwilioProvider(config);
            case 'msg91':
                throw new Error('MSG91 provider not yet implemented');
            default:
                throw new Error(`Unknown sms provider: ${config.providerId}`);
        }
    }
}

export class NotificationEngine {
    private client;

    constructor() {
        this.client = createAdminClient();
    }

    /**
     * Internal: Fetch active active config for a tenant/channel
     */
    /**
     * Internal: Fetch active active config for a tenant/channel
     * Fallback to System Global (tenant_id IS NULL) if none found.
     */
    private async getActiveConfig(tenantId: string, channel: 'email' | 'sms'): Promise<ProviderConfig | null> {
        // 1. Try Tenant Specific Config
        const { data: tenantConfig } = await this.client
            .from('tenant_notification_configs')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('channel', channel)
            .eq('is_active', true)
            .maybeSingle();

        if (tenantConfig) {
             return {
                id: tenantConfig.id,
                providerId: tenantConfig.provider_id,
                credentials: tenantConfig.credentials,
                config: tenantConfig.config
            };
        }

        // 2. Fallback to Global System Config (tenant_id IS NULL)
        const { data: globalConfig } = await this.client
            .from('tenant_notification_configs')
            .select('*')
            .is('tenant_id', null)
            .eq('channel', channel)
            .eq('is_active', true)
            .maybeSingle();

        if (globalConfig) {
             // System default used
             return {
                id: globalConfig.id,
                providerId: globalConfig.provider_id,
                credentials: globalConfig.credentials,
                config: globalConfig.config
            };
        }

        return null;
    }

    /**
     * Check if a notification for this shipment and status was already sent.
     * Checks simply if a log exists with success status for this shipmentId + status match in metadata or subject?
     * Ideally we should probably store 'trigger_status' in metadata for cleaner checks.
     */
    async hasAlreadySent(tenantId: string, shipmentId: string, status: string, type: 'email' | 'sms' | 'webhook'): Promise<boolean> {
        // Strict Idempotency: distinct status per shipment.
        // If we ever sent 'out_for_delivery' for this shipment, never send again.
        const { data, error } = await this.client
            .from('notification_logs')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('shipment_id', shipmentId)
            .eq('type', type)
            .eq('status', 'sent')
            .contains('metadata', { trigger: status })
            .limit(1);

        if (error) {
             console.error('[NotificationEngine] Check Duplicate Error:', error);
             return false;
        }

        return data && data.length > 0;
    }

    async sendEmail(tenantId: string, payload: { to: string, subject: string, html: string, text?: string, shipmentId?: string, triggerStatus?: string }) {
        const config = await this.getActiveConfig(tenantId, 'email');
        if (!config) {
             console.warn(`[NotificationEngine] No active email config for tenant ${tenantId}.`);
             return { success: false, error: 'No active provider' };
        }

        // Idempotency Check
        if (payload.shipmentId && payload.triggerStatus) {
            const isDup = await this.hasAlreadySent(tenantId, payload.shipmentId, payload.triggerStatus, 'email');
            if (isDup) {
                console.log(`[NotificationEngine] Skipping Duplicate Email for ${payload.shipmentId} @ ${payload.triggerStatus}`);
                return { success: true, skipped: true, message: 'Duplicate suppressed' };
            }
        }

        try {
            const provider = NotificationFactory.getEmailProvider(config);
            const result = await provider.sendEmail(payload);
            
            await this.log(tenantId, config.providerId, 'email', payload.to, result, payload.shipmentId, payload.triggerStatus);
            return result;
        } catch (e: any) {
            console.error('[NotificationEngine] Send Error:', e);
            await this.log(tenantId, config.providerId, 'email', payload.to, { success: false, error: e.message }, payload.shipmentId, payload.triggerStatus);
            return { success: false, error: e.message };
        }
    }

    async sendSMS(tenantId: string, payload: { to: string, body: string, shipmentId?: string, triggerStatus?: string }) {
         const config = await this.getActiveConfig(tenantId, 'sms');
        if (!config) {
             console.warn(`[NotificationEngine] No active SMS config for tenant ${tenantId}.`);
             return { success: false, error: 'No active provider' };
        }

        // Idempotency Check
         if (payload.shipmentId && payload.triggerStatus) {
            const isDup = await this.hasAlreadySent(tenantId, payload.shipmentId, payload.triggerStatus, 'sms');
            if (isDup) {
                console.log(`[NotificationEngine] Skipping Duplicate SMS for ${payload.shipmentId} @ ${payload.triggerStatus}`);
                return { success: true, skipped: true, message: 'Duplicate suppressed' };
            }
        }

        try {
            const provider = NotificationFactory.getSMSProvider(config);
            const result = await provider.sendSMS(payload);
            
            await this.log(tenantId, config.providerId, 'sms', payload.to, result, payload.shipmentId, payload.triggerStatus);
            return result;
        } catch (e: any) {
             console.error('[NotificationEngine] SMS Error:', e);
            await this.log(tenantId, config.providerId, 'sms', payload.to, { success: false, error: e.message }, payload.shipmentId, payload.triggerStatus);
            return { success: false, error: e.message };
        }
    }

    async sendWebhook(tenantId: string, payload: { url: string, data: any, shipmentId?: string, triggerStatus?: string }) {
        if (!payload.url) return { success: false, error: 'No URL provided' };

        // Idempotency Check
        if (payload.shipmentId && payload.triggerStatus) {
            const isDup = await this.hasAlreadySent(tenantId, payload.shipmentId, payload.triggerStatus, 'webhook');
            if (isDup) {
                console.log(`[NotificationEngine] Skipping Duplicate Webhook for ${payload.shipmentId} @ ${payload.triggerStatus}`);
                return { success: true, skipped: true, message: 'Duplicate suppressed' };
            }
        }

        try {
            const response = await fetch(payload.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload.data)
            });

            if (!response.ok) {
                throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
            }

            const result = { success: true, metadata: { status: response.status } };
            await this.log(tenantId, 'generic_webhook', 'webhook', payload.url, result, payload.shipmentId, payload.triggerStatus);
            return result;

        } catch (e: any) {
            console.error('[NotificationEngine] Webhook Error:', e);
            await this.log(tenantId, 'generic_webhook', 'webhook', payload.url, { success: false, error: e.message }, payload.shipmentId, payload.triggerStatus);
            return { success: false, error: e.message };
        }
    }

    private async log(tenantId: string, providerId: string, type: string, recipient: string, result: any, shipmentId?: string, trigger?: string) {
        // Merge trigger info into metadata
        const metadata = {
            ...(result.metadata || {}),
            trigger: trigger
        };

        await this.client.from('notification_logs').insert({
            tenant_id: tenantId,
            shipment_id: shipmentId || null,
            type: type,
            recipient: recipient,
            status: result.success ? 'sent' : 'failed',
            provider_id: providerId,
            metadata: metadata,
            error_message: result.error ? String(result.error) : null,
            sent_at: result.success ? new Date().toISOString() : null
        });
    }
}
