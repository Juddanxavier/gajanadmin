/** @format */

'use server';

import { Track123Service } from '@/lib/services/track123-service';
import { createClient } from '@/lib/supabase/server';
import { CarrierDetectionItem } from '@/lib/types/track123';

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

function getService() {
  const secret = process.env.TRACK123_API_SECRET;
  if (!secret) {
    throw new Error('TRACK123_API_SECRET is not configured in .env.local');
  }
  return new Track123Service({ apiKey: secret });
}

/**
 * Detects carrier for a given tracking number via Track123 v2.1 API
 */
export async function detectCarrier(
  trackingNumber: string,
): Promise<ActionResult<CarrierDetectionItem[]>> {
  try {
    const service = getService();
    const carriers = await service.detectCarrier(trackingNumber);
    return { success: true, data: carriers };
  } catch (error: any) {
    console.error('Carrier detection failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to detect carrier',
    };
  }
}

/**
 * Fetches supported carriers from Track123 and updates local DB
 * Note: Track123 v2.1 might have a different endpoint for getting ALL carriers.
 * For now, we will rely on key common carriers or a specific list endpoint if available.
 * If no endpoint exists in v2.1 for "list all", we might default to a manual list
 * or just rely on detection.
 *
 * Assuming for now we just want detection to work primarily.
 */
export async function syncCarriers(): Promise<ActionResult<any>> {
  try {
    const service = getService();
    const carriers = await service.listCouriers();

    if (!carriers || carriers.length === 0) {
      return { success: false, error: 'No carriers returned from API' };
    }

    const supabase = await createClient(); // Use service role if needed?
    // "Enable insert/update for admins" policy exists.
    // Regular client is fine if user is admin.

    const upsertData = carriers
      .filter((c) => c.courier_code && c.courier_code.trim() !== '') // Filter invalid codes
      .map((c) => ({
        code: c.courier_code,
        name_en: c.courier_name,
        type: c.courier_type || 'unknown',
        updated_at: new Date().toISOString(),
      }))
      .filter((c) => !!c.code); // Defensive check

    if (upsertData.length === 0) {
      return { success: false, error: 'No valid carriers found to sync' };
    }

    const { error } = await supabase.from('carriers').upsert(upsertData, {
      onConflict: 'code',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error('Sync Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: { count: upsertData.length } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCarriers(): Promise<ActionResult<any[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('carriers')
    .select('*')
    .order('name_en');

  if (error) {
    console.error('getCarriers error:', error);
    return { success: false, error: error.message };
  }

  console.log('getCarriers found:', data?.length);
  return { success: true, data: data || [] };
}
