/** @format */

import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '../lib/services/notification-service';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('🚀 Starting Notification Flow Test...');

  // 1. Setup: Get a Tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1)
    .single();

  if (!tenant) {
    console.error('No tenant found. Please create a tenant first.');
    return;
  }
  console.log(`Using Tenant: ${tenant.name} (${tenant.id})`);

  // 2. Setup: Create a Mock Shipment
  // We insert directly to bypass 'real' carrier creation for this test
  const trackingCode = `TEST-${Date.now()}`;
  const { data: shipment, error: shipError } = await supabase
    .from('shipments')
    .insert({
      tenant_id: tenant.id,
      carrier_tracking_code: trackingCode,
      status: 'pending', // Start pending
      provider: 'manual',
      customer_details: {
        name: 'Test User',
        email: 'test@example.com', // Dummy email
        phone: '+1234567890',
      },
      white_label_code: `WL-${Date.now()}`,
    })
    .select()
    .single();

  if (shipError) {
    console.error('Failed to create test shipment:', shipError);
    return;
  }
  console.log(`✅ Created Test Shipment: ${trackingCode}`);

  // 3. Trigger Notification (Simulate "Out for Delivery")
  console.log('🔄 Simulating Status Change to "out_for_delivery"...');
  const service = new NotificationService(supabase);

  // We manually trigger the "Queue" logic
  const payload = {
    shipmentId: shipment.id,
    tenantId: tenant.id,
    status: 'out_for_delivery',
    recipientEmail: shipment.customer_details.email,
    recipientPhone: shipment.customer_details.phone,
    recipientName: shipment.customer_details.name,
    trackingCode: shipment.carrier_tracking_code,
    referenceCode: shipment.white_label_code,
    carrier: 'manual_test',
  };

  const queueResult = await service.sendNotifications(payload);
  console.log('Queue Result:', queueResult);

  // 4. Verify Queue
  console.log('🔍 Checking Queue...');
  const { data: queueItems } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('shipment_id', shipment.id)
    .eq('status', 'pending');

  if (!queueItems || queueItems.length === 0) {
    console.error('❌ Failed: No pending items found in queue!');
    // Check if triggers blocked it
    if (queueResult.email?.skipped)
      console.log('Note: Email skipped (Triggers/Settings).');
    if (queueResult.whatsapp?.skipped)
      console.log('Note: WhatsApp skipped (Triggers/Settings).');
  } else {
    console.log(`✅ Success: Found ${queueItems.length} items in queue.`);

    // 5. Simulator Worker Processing
    console.log('⚙️ Simulating Worker Processing...');
    for (const item of queueItems) {
      console.log(`   Processing ${item.channel}...`);
      // We won't actually send real email (might fail or spam), but we call the logic.
      // Note: If you want to REALLY send, uncomment below.
      // For safety, we just mark it complete manually to prove "Worker" logic flow,
      // OR we call `service.processQueueItem(item)` if we are brave.
      // Let's call it but expect potential failure if credentials invalid.

      try {
        // Mocking success to avoid actual API calls in this test script
        // await service.processQueueItem(item);
        console.log('   [Mock] Call to provider skipped for safety.');

        await supabase
          .from('notification_queue')
          .update({ status: 'completed' })
          .eq('id', item.id);
        console.log('   marked as completed.');
      } catch (err) {
        console.error('   Processing failed:', err);
      }
    }

    console.log('✅ Test Complete. Queue items processed.');
  }

  // Cleanup
  console.log('🧹 Cleaning up test data...');
  await supabase.from('shipments').delete().eq('id', shipment.id);
  // Queue items cascade delete? Yes, configured in schema.
}

runTest().catch(console.error);
