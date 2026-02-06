/** @format */

import { createClient } from '@/lib/supabase/server';

/**
 * Generate unique white-label tracking code for shipment
 * Format: TENANT-YYYYMMDD-XXXX
 * Example: IN-20260205-0001, LK-20260205-0042
 */
export async function generateWhiteLabelCode(
  tenantId: string,
): Promise<string> {
  const supabase = await createClient();

  // Get tenant prefix
  const { data: tenant } = await supabase
    .from('tenants')
    .select('slug')
    .eq('id', tenantId)
    .single();

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Convert slug to prefix (e.g., 'india' -> 'IN', 'sri-lanka' -> 'LK')
  const prefix = getTenantPrefix(tenant.slug);

  // Get today's date in YYYYMMDD format
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  // Get count of shipments for today for this tenant
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const { count } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);

  const sequenceNumber = ((count || 0) + 1).toString().padStart(4, '0');

  const whiteLabelCode = `${prefix}-${dateStr}-${sequenceNumber}`;

  // Verify uniqueness (very unlikely to clash, but check anyway)
  const { data: existing } = await supabase
    .from('shipments')
    .select('id')
    .eq('white_label_code', whiteLabelCode)
    .single();

  if (existing) {
    // If by some chance it exists, add a random suffix
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${whiteLabelCode}-${randomSuffix}`;
  }

  return whiteLabelCode;
}

/**
 * Get tenant prefix from slug
 */
function getTenantPrefix(slug: string): string {
  const prefixMap: Record<string, string> = {
    india: 'IN',
    'sri-lanka': 'LK',
    global: 'GL',
  };

  return prefixMap[slug] || slug.substring(0, 2).toUpperCase();
}

/**
 * Validate white-label tracking code format
 */
export function isValidWhiteLabelCode(code: string): boolean {
  // Format: XX-YYYYMMDD-XXXX or XX-YYYYMMDD-XXXX-XXX
  const pattern = /^[A-Z]{2}-\d{8}-\d{4}(-\d{3})?$/;
  return pattern.test(code);
}

/**
 * Parse white-label code to extract components
 */
export function parseWhiteLabelCode(code: string): {
  tenantPrefix: string;
  date: string;
  sequence: string;
  suffix?: string;
} | null {
  if (!isValidWhiteLabelCode(code)) {
    return null;
  }

  const parts = code.split('-');
  return {
    tenantPrefix: parts[0],
    date: parts[1],
    sequence: parts[2],
    suffix: parts[3],
  };
}
