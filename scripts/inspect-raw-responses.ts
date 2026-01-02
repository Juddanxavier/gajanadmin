import { createAdminClient } from '../lib/supabase/admin';

/**
 * Debug script to inspect raw_response structure from Track123 API
 * This helps us understand what fields are actually available
 */

async function inspectRawResponses() {
  const supabase = createAdminClient();
  
  console.log('Fetching recent shipments to inspect raw_response...\n');
  
  const { data: shipments, error } = await supabase
    .from('shipments')
    .select('id, carrier_tracking_code, status, estimated_delivery, latest_location, raw_response, created_at')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (!shipments || shipments.length === 0) {
    console.log('No shipments found');
    return;
  }
  
  shipments.forEach((shipment, index) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Shipment ${index + 1}: ${shipment.carrier_tracking_code}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Status: ${shipment.status}`);
    console.log(`Estimated Delivery (DB): ${shipment.estimated_delivery || 'NULL'}`);
    console.log(`Latest Location (DB): ${shipment.latest_location || 'NULL'}`);
    console.log(`\nRaw Response Structure:`);
    console.log(JSON.stringify(shipment.raw_response, null, 2));
    
    // Analyze what fields are available
    if (shipment.raw_response) {
      const raw = shipment.raw_response;
      console.log(`\n--- Available Fields Analysis ---`);
      console.log(`Top-level keys: ${Object.keys(raw).join(', ')}`);
      
      // Check for delivery date fields
      const deliveryFields = ['expected_delivery', 'estimatedDelivery', 'eta', 'expectedDelivery'];
      console.log(`\nDelivery date fields:`);
      deliveryFields.forEach(field => {
        if (raw[field]) console.log(`  ✓ ${field}: ${raw[field]}`);
      });
      
      // Check for checkpoints
      if (raw.checkpoints && Array.isArray(raw.checkpoints)) {
        console.log(`\nCheckpoints: ${raw.checkpoints.length} found`);
        if (raw.checkpoints.length > 0) {
          const first = raw.checkpoints[0];
          console.log(`  First checkpoint keys: ${Object.keys(first).join(', ')}`);
          console.log(`  Location field: ${first.location || first.city || 'NOT FOUND'}`);
        }
      } else {
        console.log(`\nCheckpoints: NOT FOUND`);
      }
    }
  });
  
  console.log(`\n${'='.repeat(80)}\n`);
}

inspectRawResponses().catch(console.error);
