import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Settings Service
 * Centralized service for accessing application settings
 */

export interface AppSettings {
  // General
  company_name?: string;
  company_logo_url?: string;
  timezone: string;
  date_format: string;
  currency: string;
  
  // Notifications
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  notification_triggers: string[];
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_from_email?: string;
  smtp_from_name?: string;
  
  // Tracking
  default_provider: string;
  track123_api_key?: string;
  auto_sync_enabled: boolean;
  auto_sync_frequency: string;
  sync_retry_attempts: number;
  webhook_url?: string;
  
  // User & Access
  default_user_role: string;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_numbers: boolean;
  password_require_symbols: boolean;
  session_timeout_minutes: number;
  two_factor_enabled: boolean;
  
  // Appearance
  theme: string;
  primary_color: string;
  table_density: string;
  default_page_size: number;
  
  // Shipment
  default_carrier_preference: string[];
  auto_archive_days: number;
  data_retention_days: number;
  export_format: string;
  custom_fields: any[];
}

const DEFAULT_SETTINGS: AppSettings = {
  // General
  timezone: 'UTC',
  date_format: 'MM/DD/YYYY',
  currency: 'USD',
  
  // Notifications
  email_notifications_enabled: true,
  sms_notifications_enabled: false,
  notification_triggers: ['delivered', 'exception', 'out_for_delivery'],
  smtp_port: 587,
  
  // Tracking
  default_provider: 'track123',
  auto_sync_enabled: true,
  auto_sync_frequency: '12h',
  sync_retry_attempts: 3,
  
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

// Cache settings in memory (expires after 5 minutes)
const settingsCache = new Map<string, { data: AppSettings; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get settings for a specific tenant
 */
export async function getSettingsForTenant(tenantId: string): Promise<AppSettings> {
  // Check cache
  const cached = settingsCache.get(tenantId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      // Return defaults if no settings found
      return DEFAULT_SETTINGS;
    }

    // Cache the result
    settingsCache.set(tenantId, {
      data: data as AppSettings,
      timestamp: Date.now(),
    });

    return data as AppSettings;
  } catch (error) {
    console.error('[getSettingsForTenant] Error:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Get settings for current user's tenant
 */
export async function getCurrentSettings(): Promise<AppSettings> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return DEFAULT_SETTINGS;
    
    // Get user's tenant
    const { data: tenants } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1);
    
    if (!tenants || tenants.length === 0) {
      return DEFAULT_SETTINGS;
    }

    return getSettingsForTenant(tenants[0].tenant_id);
  } catch (error) {
    console.error('[getCurrentSettings] Error:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Clear settings cache for a tenant
 */
export function clearSettingsCache(tenantId?: string) {
  if (tenantId) {
    settingsCache.delete(tenantId);
  } else {
    settingsCache.clear();
  }
}

/**
 * Get SMTP configuration
 */
export async function getSMTPConfig(tenantId?: string): Promise<{
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
} | null> {
  const settings = tenantId 
    ? await getSettingsForTenant(tenantId)
    : await getCurrentSettings();

  if (!settings.smtp_host || !settings.smtp_from_email) {
    return null;
  }

  return {
    host: settings.smtp_host,
    port: settings.smtp_port || 587,
    username: settings.smtp_username || '',
    password: settings.smtp_password || '',
    from_email: settings.smtp_from_email,
    from_name: settings.smtp_from_name || 'Shipment Tracking',
  };
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(
  type: 'email' | 'sms',
  tenantId?: string
): Promise<boolean> {
  const settings = tenantId 
    ? await getSettingsForTenant(tenantId)
    : await getCurrentSettings();

  return type === 'email' 
    ? settings.email_notifications_enabled 
    : settings.sms_notifications_enabled;
}

/**
 * Get notification triggers
 */
export async function getNotificationTriggers(tenantId?: string): Promise<string[]> {
  const settings = tenantId 
    ? await getSettingsForTenant(tenantId)
    : await getCurrentSettings();

  return settings.notification_triggers || [];
}

/**
 * Get auto-sync configuration
 */
export async function getAutoSyncConfig(tenantId?: string): Promise<{
  enabled: boolean;
  frequency: string;
  retry_attempts: number;
}> {
  const settings = tenantId 
    ? await getSettingsForTenant(tenantId)
    : await getCurrentSettings();

  return {
    enabled: settings.auto_sync_enabled,
    frequency: settings.auto_sync_frequency,
    retry_attempts: settings.sync_retry_attempts,
  };
}

/**
 * Get Track123 API key
 */
export async function getTrack123ApiKey(tenantId?: string): Promise<string | null> {
  const settings = tenantId 
    ? await getSettingsForTenant(tenantId)
    : await getCurrentSettings();

  return settings.track123_api_key || null;
}

/**
 * Get webhook URL
 */
export async function getWebhookUrl(tenantId?: string): Promise<string | null> {
  const settings = tenantId 
    ? await getSettingsForTenant(tenantId)
    : await getCurrentSettings();

  return settings.webhook_url || null;
}

/**
 * Format date according to settings
 */
export function formatDate(date: Date | string, settings: AppSettings): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  switch (settings.date_format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
    default:
      return `${month}/${day}/${year}`;
  }
}

/**
 * Format currency according to settings
 */
export function formatCurrency(amount: number, settings: AppSettings): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
  };

  const symbol = symbols[settings.currency] || '$';
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Get password requirements
 */
export async function getPasswordRequirements(tenantId?: string): Promise<{
  min_length: number;
  require_uppercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
}> {
  const settings = tenantId 
    ? await getSettingsForTenant(tenantId)
    : await getCurrentSettings();

  return {
    min_length: settings.password_min_length,
    require_uppercase: settings.password_require_uppercase,
    require_numbers: settings.password_require_numbers,
    require_symbols: settings.password_require_symbols,
  };
}

/**
 * Validate password against requirements
 */
export async function validatePassword(
  password: string,
  tenantId?: string
): Promise<{ valid: boolean; errors: string[] }> {
  const requirements = await getPasswordRequirements(tenantId);
  const errors: string[] = [];

  if (password.length < requirements.min_length) {
    errors.push(`Password must be at least ${requirements.min_length} characters`);
  }

  if (requirements.require_uppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requirements.require_numbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requirements.require_symbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one symbol');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
