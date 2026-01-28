/** @format */

import * as dotenv from 'dotenv';
import * as path from 'path';

// 1. Load Environment Variables FIRST
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

// 2. Dynamic Imports to ensure env vars are loaded before modules that check them
async function main() {
  console.log('🔄 Importing dependencies...');

  const { createClient } = await import('@supabase/supabase-js');
  // Use relative path that resolves correctly from scripts/ folder
  const { ShipmentService } = await import('../lib/services/shipment-service');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Environment Variables even after load!');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const service = new ShipmentService(supabase);

  console.log('🧪 Testing Auto-Creation of Missing Carriers...');

  // 1. Setup - Ensure a carrier DOES NOT exist
  const newCarrierCode = 'dhl'; // Real carrier to avoid A0400 error
  console.log(`   Target Carrier Code: ${newCarrierCode}`);

  // Cleanup beforehand
  await supabase.from('carriers').delete().eq('code', newCarrierCode);

  // 2. Mock Shipment Data
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (!user || !tenant) {
    console.error('❌ Missing user or tenant for test');
    return;
  }

  const trackingNum = `TRK-${newCarrierCode}`;

  try {
    console.log('   Attempting to create shipment...');
    const shipment = await service.createShipment({
      tracking_number: trackingNum,
      carrier_code: newCarrierCode, // This doesn't exist yet!
      customer_name: 'Auto Create Test',
      userId: user.id,
      tenantId: tenant.id,
    });
    console.log(`✅ Shipment created successfully! ID: ${shipment.id}`);

    // 3. Verify Carrier was Created
    const { data: carrier } = await supabase
      .from('carriers')
      .select('*')
      .eq('code', newCarrierCode)
      .single();
    if (carrier) {
      console.log(`✅ Carrier '${newCarrierCode}' was auto-created.`);
      console.log(`   Name: ${carrier.name_en}`);
    } else {
      console.error(`❌ Carrier '${newCarrierCode}' was NOT found in DB.`);
    }

    // Cleanup
    await service.deleteShipment(shipment.id, false);
    await supabase.from('carriers').delete().eq('code', newCarrierCode);
    console.log('   Cleanup done.');
  } catch (error: any) {
    console.error('❌ Failed:', error);
  }
}

main().catch(console.error);
