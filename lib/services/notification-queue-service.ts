/** @format */

import { createAdminClient } from '../supabase/admin';
import { logger } from '../logger';
import { emailService } from './email-service';
// import { whatsappService } from './whatsapp-service'; // Uncomment when ready

export class NotificationQueueService {
  /**
   * Main entry point: Process pending items from the queue
   */
  async processQueue(limit = 50) {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // 1. Fetch Pending Items (Respecting Schedule & Priority)
    const { data: queueItems, error } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('priority', { ascending: false }) // High priority first
      .order('scheduled_for', { ascending: true }) // Then oldest scheduled
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch notification queue', error);
      return { processed: 0, errors: 1 };
    }

    if (!queueItems || queueItems.length === 0) {
      return { processed: 0, errors: 0 };
    }

    logger.info(`Processing ${queueItems.length} notification items...`);

    let processedCount = 0;
    let errorCount = 0;

    // 2. Process Each Item
    for (const item of queueItems) {
      try {
        // Mark as 'processing' (Optimistic Lock)
        await supabase
          .from('notification_queue')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        const result = await this.processItem(supabase, item);

        // Update Final Status
        if (result.success) {
          await supabase
            .from('notification_queue')
            .update({
              status: 'completed',
              execution_log: result.logs,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);
        } else {
          // Handle Failure (Retry Logic)
          const nextRetry = item.retry_count + 1;
          if (nextRetry < (item.max_retries || 3)) {
            // Exponential Backoff: 1m, 5m, 25m...
            const backoffMinutes = Math.pow(5, nextRetry);
            const nextSchedule = new Date(
              Date.now() + backoffMinutes * 60000,
            ).toISOString();

            await supabase
              .from('notification_queue')
              .update({
                status: 'pending', // Re-queue
                retry_count: nextRetry,
                scheduled_for: nextSchedule,
                execution_log: result.logs,
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.id);
          } else {
            // Max Retries Exceeded
            await supabase
              .from('notification_queue')
              .update({
                status: 'failed',
                execution_log: result.logs,
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.id);
          }
          errorCount++;
        }
        processedCount++;
      } catch (err: any) {
        logger.error(`Error processing queue item ${item.id}`, err);
        // Safety net: mark failed
        await supabase
          .from('notification_queue')
          .update({ status: 'failed', execution_log: { error: err.message } })
          .eq('id', item.id);
        errorCount++;
      }
    }

    return { processed: processedCount, errors: errorCount };
  }

  /**
   * Logic for a single item: Check settings, Fan-out, Execute
   */
  private async processItem(
    supabase: any,
    item: any,
  ): Promise<{ success: boolean; logs: any }> {
    const logs: any = {};
    let atLeastOneSuccess = false;
    let atLeastOneAttempt = false;

    const { tenant_id, event_type, payload } = item;

    // A. Fetch Configuration (Providers & Triggers)
    // 1. Get Settings (Triggers)
    const { data: settings } = await supabase
      .from('settings')
      .select('notification_triggers')
      .eq('tenant_id', tenant_id)
      .single();

    const enabledTriggers: string[] = settings?.notification_triggers || [];

    // 2. Get Providers
    let { data: configs } = await supabase
      .from('tenant_notification_configs')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_enabled', true);

    // FIX: Fallback to Env Vars if DB config is empty
    // This allows local development with .env.local to work without UI configuration
    if (
      (!configs || configs.length === 0) &&
      (process.env.SMTP_HOST || process.env.ZEPTOMAIL_API_KEY)
    ) {
      // Create a 'virtual' provider config to trigger the EmailService logic
      configs = [{ channel: 'email', is_enabled: true }] as any;
    }

    // B. Fan-Out Logic

    // Check if this Event Type is globally enabled for the tenant?
    const isTriggerEnabled =
      enabledTriggers.includes(event_type) || event_type === 'shipment_created';

    if (!isTriggerEnabled && enabledTriggers.length > 0) {
      return {
        success: true,
        logs: { message: 'Skipped: Trigger not enabled in settings' },
      };
    }

    // Iterate Providers
    if (configs) {
      for (const config of configs) {
        const channel = config.channel;
        atLeastOneAttempt = true;

        try {
          if (channel === 'email') {
            // Send Email
            const result = await emailService.sendTemplateEmail({
              tenantId: tenant_id,
              to: payload.customer_email,
              templateType: event_type,
              variables: {
                ...payload,
                status: payload.new_status,
              },
            });

            logs['email'] = result.success ? 'sent' : `failed: ${result.error}`;
            if (result.success) atLeastOneSuccess = true;
          } else if (channel === 'whatsapp') {
            // const res = await whatsappService.send(...)
            logs['whatsapp'] = 'skipped_impl_pending';
          }
        } catch (providerErr: any) {
          logs[channel] = `error: ${providerErr.message}`;
        }
      }
    }

    if (!atLeastOneAttempt) {
      return {
        success: true,
        logs: { message: 'Skipped: No active providers' },
      };
    }

    const success = atLeastOneSuccess;
    return { success, logs };
  }
}

export const notificationQueueService = new NotificationQueueService();
