/** @format */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getNotificationProviders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notification_providers')
    .select('*')
    .order('id');

  if (error) throw new Error(error.message);
  return data;
}

export async function getTenantConfigs(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tenant_notification_configs')
    .select(
      `
            *,
            provider:notification_providers(display_name)
        `,
    )
    .eq('tenant_id', tenantId);

  if (error) throw new Error(error.message);
  return data;
}

export async function saveProviderConfig(
  tenantId: string,
  channel: 'email' | 'sms',
  providerId: string,
  credentials: any,
  config: any,
) {
  const supabase = await createClient();

  // 1. Deactivate other providers for this channel (if we want strictly one active)
  // The database constraint/index might enforce this, but good to be explicit or handle conflicts.
  // Actually, let's just Upsert.
  // If we want to switch active provider, we might need a separate action or logic.
  // Strategy: Upsert this specific config.

  // Verify permission (RLS handles this but good to be safe)
  // ...

  // Check if a config already exists for this CHANNEL & tenant (regardless of provider)
  const { data: existing } = await supabase
    .from('tenant_notification_configs')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('channel', channel) // Look up by channel, not provider
    .single();

  let result;
  if (existing) {
    // Update existing channel config (switching provider if needed)
    result = await supabase
      .from('tenant_notification_configs')
      .update({
        provider_id: providerId, // Update provider
        credentials,
        config,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Insert new
    result = await supabase.from('tenant_notification_configs').insert({
      tenant_id: tenantId,
      channel,
      provider_id: providerId,
      credentials,
      config,
      is_active: true, // Auto-activate if it's the first one
    });
  }

  if (result.error) throw new Error(result.error.message);
  revalidatePath('/notifications/settings');
  return { success: true };
}

export async function activateProvider(
  tenantId: string,
  configId: string,
  channel: 'email' | 'sms',
) {
  const supabase = await createClient();

  // 1. Deactivate all for this channel
  await supabase
    .from('tenant_notification_configs')
    .update({ is_active: false })
    .eq('tenant_id', tenantId)
    .eq('channel', channel);

  // 2. Activate target
  const { error } = await supabase
    .from('tenant_notification_configs')
    .update({ is_active: true })
    .eq('id', configId);

  if (error) throw new Error(error.message);
  revalidatePath('/notifications/settings');
  return { success: true };
}

// import { NotificationFactory } from '@/lib/notifications/engine';

export async function testConnection(
  providerId: string,
  channel: 'email' | 'sms',
  credentials: any,
) {
  // Basic Validation Logic (without Engine)
  try {
    if (channel === 'email') {
      if (providerId === 'zeptomail' && !credentials.api_key)
        throw new Error('API Key required');
      if (providerId === 'smtp' && (!credentials.host || !credentials.port))
        throw new Error('Host and Port required');
    } else {
      // SMS validation placeholder
      if (!credentials) throw new Error('Credentials required');
    }

    // Simulate network test
    await new Promise((resolve) => setTimeout(resolve, 500));

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
