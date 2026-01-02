'use server';

import { createClient } from '@/lib/supabase/server';

export async function getPublicShipmentByCode(trackingCode: string) {
  const supabase = await createClient();

  try {
    // Public query - no auth required
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select(`
        id,
        white_label_code,
        carrier_tracking_code,
        carrier_id,
        status,
        latest_location,
        estimated_delivery,
        created_at,
        last_synced_at,
        customer_details
      `)
      .or(`white_label_code.eq.${trackingCode},carrier_tracking_code.eq.${trackingCode}`)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Tracking number not found' };
      }
      throw error;
    }

    // Get tracking events
    const { data: events } = await supabase
      .from('tracking_events')
      .select('*')
      .eq('shipment_id', shipment.id)
      .order('occurred_at', { ascending: false });

    return {
      success: true,
      data: {
        shipment,
        events: events || [],
      },
    };
  } catch (error: any) {
    console.error('Public tracking error:', error);
    return { success: false, error: error.message };
  }
}
