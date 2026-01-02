import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ShipmentService } from '@/lib/services/shipment-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max

export async function GET(request: Request) {
  // Security check: verify authorization header (Cron secret)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const shipmentService = new ShipmentService(supabase);

  try {
      // Find shipments that need syncing: not delivered, not expired, not deleted
      // We prioritize those that haven't been synced recently
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('id, carrier_tracking_code, status, last_synced_at, created_at')
        .in('status', ['pending', 'info_received', 'in_transit', 'out_for_delivery', 'exception', 'attempt_fail', 'unknown'])
        .is('deleted_at', null)
        .order('last_synced_at', { ascending: true, nullsFirst: true })
        .limit(20); // Process batch of 20 to avoid timeouts

      if (error) throw error;

      if (!shipments || shipments.length === 0) {
          return NextResponse.json({ message: 'No shipments to sync' });
      }

      console.log(`[Cron] Syncing ${shipments.length} shipments...`);

      const results = [];
      const stats = { success: 0, error: 0, updated: 0, deleted: 0 };

      for (const s of shipments) {
          try {
              // Add a small delay to avoid rate limits? Track123 limit is usually high enough (3/s)
              const result = await shipmentService.syncShipment(s.id);
              
              if (result.status !== s.status) {
                  stats.updated++;
              }
              stats.success++;
              results.push({ 
                  id: s.id, 
                  tracking: s.carrier_tracking_code,
                  status: 'success', 
                  oldStatus: s.status, 
                  newStatus: result.status 
              });
          } catch (e: any) {
              console.error(`[Cron] Failed to sync ${s.carrier_tracking_code}:`, e.message);
              stats.error++;
              
              // Handle "Not Found" or "Pending Loop" cases
              const isNotFound = e.message?.toLowerCase().includes('not found') || e.message?.includes('A0400');
              const isStalePending = s.status === 'pending' && new Date(s.created_at).getTime() < Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days

              if (isNotFound || isStalePending) {
                   console.log(`[Cron] Auto-deleting invalid/stale shipment: ${s.carrier_tracking_code}`);
                   await shipmentService.deleteShipment(s.id, true); // Soft delete
                   stats.deleted++;
                   results.push({
                       id: s.id,
                       tracking: s.carrier_tracking_code,
                       status: 'deleted',
                       reason: isNotFound ? 'Not Found' : 'Stale Pending'
                   });
              } else {
                  // KEY FIX: Always update last_synced_at even on failure to prevent loop
                  await supabase
                    .from('shipments')
                    .update({ last_synced_at: new Date().toISOString() })
                    .eq('id', s.id);

                  results.push({ 
                      id: s.id, 
                      tracking: s.carrier_tracking_code,
                      status: 'error', 
                      error: e.message 
                  });
              }
          }
      }

      return NextResponse.json({ 
          success: true, 
          stats,
          results 
      });

  } catch (error: any) {
      console.error('[Cron] Sync Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
