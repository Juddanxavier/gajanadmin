/** @format */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Load env vars immediately, BEFORE other imports
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from ${envPath}`);
dotenv.config({ path: envPath });

// Configuration
const BATCH_SIZE = 20;
const MIN_AGE_MINUTES = 10;
const MAX_AGE_DAYS = 7;

async function syncPendingShipments() {
  // 2. Validate Env
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error('❌ Missing SUPABASE env vars. Script requires .env.local');
    process.exit(1);
  }

  // 3. Dynamic Import to prevent hoisting issues with @/lib/env
  const { ShipmentService } = await import('../lib/services/shipment-service');

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  // We manually inject the client to avoid ShipmentService creating its own default one
  const shipmentService = new ShipmentService(adminClient);

  console.log('🔄 Starting Shipment Auto-Sync...');
  const now = new Date();
  const minAgeTime = new Date(
    now.getTime() - MIN_AGE_MINUTES * 60 * 1000,
  ).toISOString();
  const maxAgeTime = new Date(
    now.getTime() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  // 4. Fetch Candidates
  const { data: shipments, error } = await adminClient
    .from('shipments')
    .select('id, carrier_tracking_code, status, created_at, provider')
    .in('status', ['pending', 'info_received', 'created'])
    .is('deleted_at', null)
    .lte('created_at', minAgeTime)
    .gte('created_at', maxAgeTime)
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('❌ Failed to fetch shipments:', error);
    process.exit(1);
  }

  if (!shipments || shipments.length === 0) {
    console.log('✅ No pending shipments found requiring sync.');
    process.exit(0);
  }

  console.log(`📦 Found ${shipments.length} pending shipments to sync.`);

  // 5. Process Sync
  let successCount = 0;
  let failCount = 0;

  for (const shipment of shipments) {
    console.log(
      `Processing ${shipment.carrier_tracking_code} (${shipment.status})...`,
    );
    try {
      const result = await shipmentService.syncShipment(shipment.id);
      console.log(`  -> Synced! New Status: ${result.status}`);
      successCount++;
    } catch (err: any) {
      console.error(`  -> Failed: ${err.message}`);
      failCount++;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('==========================================');
  console.log(`Summary: ${successCount} Success, ${failCount} Failed`);
  console.log('✅ Auto-Sync Completed.');
}

syncPendingShipments().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
