import { createAdminClient } from '@/lib/supabase/admin';

export async function getShipmentDetails(id: string) {
  const supabase = createAdminClient();
  
  console.log('[getShipmentDetails] Fetching shipment:', id);
  
  // Fetch shipment
  const { data: shipment, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('[getShipmentDetails] Error fetching shipment:', error);
    return null;
  }
  
  if (!shipment) {
    console.log('[getShipmentDetails] Shipment not found');
    return null;
  }
  
  console.log('[getShipmentDetails] Shipment found:', shipment.carrier_tracking_code);
  
  // Fetch tracking events from table
  const { data: events, error: eventsError } = await supabase
    .from('tracking_events')
    .select('*')
    .eq('shipment_id', id)
    .order('occurred_at', { ascending: false });
  
  if (eventsError) {
    console.error('[getShipmentDetails] Error fetching events:', eventsError);
  }
  
  let finalEvents = events || [];
  
  // Fallback: Extract events from raw_response if table is empty
  if (finalEvents.length === 0 && shipment.raw_response) {
    console.log('[getShipmentDetails] No events in table, extracting from raw_response');
    console.log('[getShipmentDetails] raw_response keys:', Object.keys(shipment.raw_response));
    console.log('[getShipmentDetails] Has localLogisticsInfo?', !!shipment.raw_response.localLogisticsInfo);
    console.log('[getShipmentDetails] Has trackingDetails?', !!shipment.raw_response.trackingDetails);
    finalEvents = extractEventsFromRawResponse(shipment.raw_response);
  }
  
  console.log('[getShipmentDetails] Found', finalEvents.length, 'events');

  // Fetch notification logs
  const { data: logs, error: logsError } = await supabase
    .from('notification_logs')
    .select('*')
    .eq('shipment_id', id)
    .order('created_at', { ascending: false });

  if (logsError) {
      console.error('[getShipmentDetails] Error fetching notification logs:', logsError);
  }

  return {
    shipment,
    events: finalEvents,
    logs: logs || []
  };
}

/**
 * Extract tracking events from raw_response JSON
 * Handles Track123 API v2.1 format
 */
function extractEventsFromRawResponse(rawResponse: any): any[] {
  const events: any[] = [];
  
  // Track123 v2.1 format: localLogisticsInfo.trackingDetails
  if (rawResponse.localLogisticsInfo?.trackingDetails && Array.isArray(rawResponse.localLogisticsInfo.trackingDetails)) {
    return rawResponse.localLogisticsInfo.trackingDetails.map((detail: any, index: number) => ({
      id: `raw-${index}`,
      shipment_id: null,
      occurred_at: detail.eventTimeZeroUTC || detail.eventTime || new Date().toISOString(),
      location: detail.address || null,
      description: detail.eventDetail || 'Status update',
      status: mapTrackingStatus(detail.transitSubStatus || detail.eventDetail),
      raw_status: detail.transitSubStatus || detail.eventDetail,
      created_at: new Date().toISOString(),
    })).sort((a: any, b: any) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  }
  
  // Fallback: trackingDetails at root level
  if (rawResponse.trackingDetails && Array.isArray(rawResponse.trackingDetails)) {
    return rawResponse.trackingDetails.map((detail: any, index: number) => ({
      id: `raw-${index}`,
      shipment_id: null,
      occurred_at: detail.trackingTime || detail.time || new Date().toISOString(),
      location: detail.trackingLocation || detail.location || detail.city || null,
      description: detail.trackingStatus || detail.message || detail.status_name || 'Status update',
      status: mapTrackingStatus(detail.trackingStatus || detail.status),
      raw_status: detail.trackingStatus || detail.status,
      created_at: new Date().toISOString(),
    })).sort((a: any, b: any) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  }
  
  // Alternative format: checkpoints array
  if (rawResponse.checkpoints && Array.isArray(rawResponse.checkpoints)) {
    return rawResponse.checkpoints.map((cp: any, index: number) => ({
      id: `raw-${index}`,
      shipment_id: null,
      occurred_at: cp.created_at || cp.time || new Date().toISOString(),
      location: cp.location || cp.city || null,
      description: cp.message || cp.status_name || 'Status update',
      status: mapTrackingStatus(cp.status),
      raw_status: cp.status,
      created_at: new Date().toISOString(),
    })).sort((a: any, b: any) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  }
  
  return events;
}

/**
 * Map raw tracking status to normalized status
 */
function mapTrackingStatus(status: string): string {
  if (!status) return 'pending';
  
  const statusUpper = status.toUpperCase();
  
  // Track123 transitSubStatus codes
  if (statusUpper.includes('DELIVERED')) return 'delivered';
  if (statusUpper.includes('OUT_FOR_DELIVERY')) return 'out_for_delivery';
  if (statusUpper.includes('IN_TRANSIT')) return 'in_transit';
  if (statusUpper.includes('INFO_RECEIVED')) return 'received';
  if (statusUpper.includes('EXCEPTION') || statusUpper.includes('EXPIRED')) return 'exception';
  
  // Text-based matching
  const statusLower = status.toLowerCase();
  if (statusLower.includes('delivered')) return 'delivered';
  if (statusLower.includes('out for delivery')) return 'out_for_delivery';
  if (statusLower.includes('transit') || statusLower.includes('transport')) return 'in_transit';
  if (statusLower.includes('picked') || statusLower.includes('received')) return 'received';
  if (statusLower.includes('exception') || statusLower.includes('failed')) return 'exception';
  
  return 'in_transit';
}
