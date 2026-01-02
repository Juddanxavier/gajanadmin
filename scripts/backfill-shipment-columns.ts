import { createAdminClient } from '../lib/supabase/admin';

/**
 * Backfill script to populate new shipment columns from existing raw_response data
 * Run this once after applying the migration to populate historical data
 */

async function backfillShipmentColumns() {
  const supabase = createAdminClient();
  
  console.log('Starting backfill of shipment columns...');
  
  // Fetch all shipments with raw_response data
  const { data: shipments, error } = await supabase
    .from('shipments')
    .select('id, raw_response')
    .not('raw_response', 'is', null);
  
  if (error) {
    console.error('Error fetching shipments:', error);
    return;
  }
  
  console.log(`Found ${shipments.length} shipments to process`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  for (const shipment of shipments) {
    const raw = shipment.raw_response;
    
    // Skip if raw_response is already minimal (only has metadata keys)
    const keys = Object.keys(raw);
    if (keys.length <= 5 && keys.includes('synced_at')) {
      skippedCount++;
      continue;
    }
    
    // Extract data from full API response
    const updates: any = {};
    
    // Extract estimated_delivery
    if (raw.expected_delivery || raw.estimatedDelivery || raw.eta) {
      updates.estimated_delivery = raw.expected_delivery || raw.estimatedDelivery || raw.eta;
    }
    
    // Extract latest_location from first checkpoint
    if (raw.checkpoints && raw.checkpoints.length > 0) {
      const firstCheckpoint = raw.checkpoints[0];
      updates.latest_location = firstCheckpoint.location || firstCheckpoint.city;
    }
    
    // Only update if we have data to update
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('shipments')
        .update(updates)
        .eq('id', shipment.id);
      
      if (updateError) {
        console.error(`Error updating shipment ${shipment.id}:`, updateError);
      } else {
        updatedCount++;
        if (updatedCount % 10 === 0) {
          console.log(`Processed ${updatedCount} shipments...`);
        }
      }
    } else {
      skippedCount++;
    }
  }
  
  console.log('\nBackfill complete!');
  console.log(`  - Updated: ${updatedCount} shipments`);
  console.log(`  - Skipped: ${skippedCount} shipments (no data or already minimal)`);
}

backfillShipmentColumns().catch(console.error);
