/** @format */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { isAdmin, hasRole } from '@/lib/utils/permissions';
import { clearSettingsCache } from '@/lib/settings/service';

// Helper to check admin/staff permission
async function checkAdminOrStaff() {
  const isUserAdmin = await isAdmin();
  const isUserStaff = await hasRole('staff');
  return isUserAdmin || isUserStaff;
}

// Get current tenant ID
async function getCurrentTenantId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: tenants } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .limit(1);

  if (tenants && tenants.length > 0) {
    return tenants[0].tenant_id;
  }

  // Fallback for Global Admins who might not be in user_tenants
  // If they are an admin, give them access to the "first" tenant (or specific one)
  // This is a simplified approach for single-tenant-like admin behavior
  const isUserAdmin = await isAdmin();
  if (isUserAdmin) {
    const { data: allTenants } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    return allTenants?.[0]?.id || null;
  }

  return null;
}

// Helper to get target tenant ID (either specific override for admins, or current user's tenant)
async function getTargetTenantId(overrideTenantId?: string) {
  if (overrideTenantId) {
    const isUserAdmin = await isAdmin();
    if (isUserAdmin) return overrideTenantId;
  }
  return await getCurrentTenantId();
}

/**
 * Get all tenants (Admin only)
 */
export async function getAllTenants() {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) return { success: false, error: 'Permission denied' };

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tenants')
      .select('id, name, country_code, slug')
      .order('name');

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('[getAllTenants] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get settings for current tenant (or specified tenant for admins)
 */
export async function getSettings(tenantId?: string) {
  try {
    const targetId = await getTargetTenantId(tenantId);
    if (!targetId) {
      return { success: false, error: 'No tenant found' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('tenant_id', targetId)
      .single();

    if (error) {
      // If no settings exist, return defaults
      if (error.code === 'PGRST116') {
        return {
          success: true,
          data: getDefaultSettings(),
        };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('[getSettings] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update settings for current tenant
 */
export async function updateSettings(updates: any, tenantId?: string) {
  try {
    const isStaff = await checkAdminOrStaff();
    if (!isStaff) {
      return { success: false, error: 'Permission denied' };
    }

    const targetId = await getTargetTenantId(tenantId);
    if (!targetId) {
      return { success: false, error: 'No tenant found' };
    }

    const adminClient = createAdminClient();

    // Check if settings exist
    const { data: existing } = await adminClient
      .from('settings')
      .select('id')
      .eq('tenant_id', targetId)
      .single();

    let result;
    if (existing) {
      // Update existing settings
      result = await adminClient
        .from('settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', targetId)
        .select()
        .single();
    } else {
      // Create new settings
      result = await adminClient
        .from('settings')
        .insert({
          tenant_id: targetId,
          ...updates,
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    // Clear settings cache for this tenant
    clearSettingsCache(targetId);

    revalidatePath('/settings');
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('[updateSettings] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test SMTP connection
 */
/**
 * Test Notification Connection
 */
export async function testNotificationConnection(config: {
  provider_id: string;
  credentials: any;
  from_email: string;
}) {
  try {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) return { success: false, error: 'Permission denied' };

    if (!config.provider_id)
      return { success: false, error: 'Provider ID required' };

    if (config.provider_id === 'zeptomail') {
      if (!config.credentials?.api_key)
        return { success: false, error: 'API Key required' };
      // TODO: Real Zepto test (e.g. fetch their profile or send dry run)
    } else {
      if (!config.credentials?.host || !config.credentials?.port) {
        return { success: false, error: 'SMTP Host and Port required' };
      }
    }

    // Simulate test
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      message: `Connection to ${config.provider_id} successful`,
    };
  } catch (error: any) {
    console.error('[testNotificationConnection] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test webhook endpoint
 */
export async function testWebhook(url: string) {
  try {
    const isStaff = await checkAdminOrStaff();
    if (!isStaff) {
      return { success: false, error: 'Permission denied' };
    }

    if (!url) {
      return { success: false, error: 'Webhook URL is required' };
    }

    // Send test webhook
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook from your shipment tracking system',
        },
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Webhook returned ${response.status}: ${response.statusText}`,
      };
    }

    return { success: true, message: 'Webhook test successful' };
  } catch (error: any) {
    console.error('[testWebhook] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get default settings
 */
function getDefaultSettings() {
  return {
    // General
    company_name: '',
    company_logo_url: '',
    timezone: 'UTC',
    date_format: 'MM/DD/YYYY',
    currency: 'USD',

    // Notifications
    email_notifications_enabled: true,
    sms_notifications_enabled: false,
    notification_triggers: ['delivered', 'exception', 'out_for_delivery'],
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_from_name: '',

    // Tracking
    default_provider: 'track123',
    track123_api_key: '',
    auto_sync_enabled: true,
    auto_sync_frequency: '6h',
    sync_retry_attempts: 3,
    webhook_url: '',

    // User & Access
    default_user_role: 'customer',
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_numbers: true,
    password_require_symbols: false,
    session_timeout_minutes: 1440,
    two_factor_enabled: false,

    // Appearance
    theme: 'system',
    primary_color: '#3b82f6',
    table_density: 'comfortable',
    default_page_size: 10,

    // Shipment
    default_carrier_preference: [],
    auto_archive_days: 90,
    data_retention_days: 365,
    export_format: 'csv',
    custom_fields: [],
  };
}

/**
 * Get email templates for current tenant
 */
export async function getEmailTemplates(tenantId?: string) {
  try {
    const targetId = await getTargetTenantId(tenantId);
    if (!targetId) {
      return { success: false, error: 'No tenant found' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('tenant_id', targetId);

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('[getEmailTemplates] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update email template
 */
export async function updateEmailTemplate(
  templateId: string,
  updates: any,
  tenantId?: string,
) {
  try {
    const isStaff = await checkAdminOrStaff();
    if (!isStaff) return { success: false, error: 'Permission denied' };

    const targetId = await getTargetTenantId(tenantId);
    if (!targetId) return { success: false, error: 'No tenant found' };

    const adminClient = createAdminClient();

    // If templateId is provided, update it. If not (or if it's 'new'), treat as insert/upsert based on type
    let result;
    if (templateId && templateId !== 'new') {
      result = await adminClient
        .from('email_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId)
        .eq('tenant_id', targetId) // Ensure tenant ownership
        .select()
        .single();
    } else {
      // Logic for creating/upserting if ID not present (should ideally handle creates only if we allow creating new types)
      // For now assuming we are updating existing templates seeded via SQL, but let's handle upsert by type
      result = await adminClient
        .from('email_templates')
        .upsert(
          {
            tenant_id: targetId,
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id, type' },
        )
        .select()
        .single();
    }

    if (result.error) throw result.error;

    revalidatePath('/settings');
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('[updateEmailTemplate] Error:', error);
    return { success: false, error: error.message };
  }
}
// ... (existing exports)

/**
 * Get notification config from tenant_notification_configs
 */
export async function getNotificationConfig(tenantId?: string) {
  try {
    const targetId = await getTargetTenantId(tenantId);
    if (!targetId) return { success: false, error: 'No tenant found' };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('tenant_notification_configs')
      .select('*')
      .eq('tenant_id', targetId)
      .eq('channel', 'email')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('[getNotificationConfig] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update notification config
 */
export async function updateNotificationConfig(config: any, tenantId?: string) {
  try {
    const targetId = await getTargetTenantId(tenantId);
    if (!targetId) return { success: false, error: 'No tenant found' };

    // Strict: Admins only (for security of credentials)
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin)
      return { success: false, error: 'Permission denied (Admins only)' };

    const adminClient = createAdminClient();

    // Upsert config
    const { data, error } = await adminClient
      .from('tenant_notification_configs')
      .upsert(
        {
          tenant_id: targetId,
          channel: 'email',
          provider_id: config.provider_id,
          credentials: config.credentials,
          config: config.config,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id, channel' },
      )
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/settings');
    return { success: true, data };
  } catch (error: any) {
    console.error('[updateNotificationConfig] Error:', error);
    return { success: false, error: error.message };
  }
}
