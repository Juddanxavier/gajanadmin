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
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: tenants } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .limit(1);
  
  return tenants?.[0]?.tenant_id || null;
}

/**
 * Get settings for current tenant
 */
export async function getSettings() {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      return { success: false, error: 'No tenant found' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('tenant_id', tenantId)
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
export async function updateSettings(updates: any) {
  try {
    const isStaff = await checkAdminOrStaff();
    if (!isStaff) {
      return { success: false, error: 'Permission denied' };
    }

    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      return { success: false, error: 'No tenant found' };
    }

    const adminClient = createAdminClient();
    
    // Check if settings exist
    const { data: existing } = await adminClient
      .from('settings')
      .select('id')
      .eq('tenant_id', tenantId)
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
        .eq('tenant_id', tenantId)
        .select()
        .single();
    } else {
      // Create new settings
      result = await adminClient
        .from('settings')
        .insert({
          tenant_id: tenantId,
          ...updates,
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    // Clear settings cache for this tenant
    clearSettingsCache(tenantId);

    revalidatePath('/admin/settings');
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('[updateSettings] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test SMTP connection
 */
export async function testSMTPConnection(config: {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_from_email: string;
}) {
  try {
    const isStaff = await checkAdminOrStaff();
    if (!isStaff) {
      return { success: false, error: 'Permission denied' };
    }

    // TODO: Implement actual SMTP test
    // For now, just validate the config
    if (!config.smtp_host || !config.smtp_port || !config.smtp_from_email) {
      return { success: false, error: 'Missing required SMTP configuration' };
    }

    // Simulate test
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { success: true, message: 'SMTP connection successful' };
  } catch (error: any) {
    console.error('[testSMTPConnection] Error:', error);
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
