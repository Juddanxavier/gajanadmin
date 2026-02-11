/** @format */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

// Dynamic imports to ensure env vars are loaded first
async function main() {
  const { createAdminClient } = await import('../lib/supabase/admin');
  const { notificationQueueService } =
    await import('../lib/services/notification-queue-service');
  const { logger } = await import('../lib/logger');
  const { randomUUID } = await import('crypto');

  await testNotificationFlow(
    createAdminClient,
    notificationQueueService,
    logger,
    randomUUID,
  );
}

async function testNotificationFlow(
  createAdminClient: any,
  notificationQueueService: any,
  logger: any,
  randomUUID: any,
) {
  const supabase = createAdminClient();

  console.log('🚀 Starting Notification Flow Test...');

  // 1. Get a Tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (!tenant) {
    console.error('❌ No tenant found. Cannot run test.');
    return;
  }

  const tenantId = tenant.id;
  console.log(`Using Tenant ID: ${tenantId}`);

  // 2. Insert Test Queue Item
  const payload = {
    customer_name: 'Test User',
    customer_email: 'test@example.com',
    customer_phone: '1234567890',
    white_label_code: 'TEST-WL-001',
    tracking_code: 'TEST-TRACK-123',
    new_status: 'out_for_delivery',
    amount: '100.00',
    company_name: 'Test Company',
  };

  // Generate random UUID for reference_id
  const referenceId = randomUUID();

  console.log('📝 Inserting queue item...');
  const { data: queueItem, error: insertError } = await supabase
    .from('notification_queue')
    .insert({
      tenant_id: tenantId,
      reference_id: referenceId, // Required by advanced schema
      event_type: 'shipment_status',
      // channel: 'whatsapp', // REMOVED: Advanced schema is channel-agnostic
      status: 'pending',
      payload: payload, // Changed from template_data to payload
      priority: 1,
      scheduled_for: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Failed to insert queue item:', insertError);
    return;
  }

  console.log(`✅ Queue Item Created: ${queueItem.id}`);

  console.log('⏰ Item Scheduled For:', queueItem.scheduled_for);
  console.log('⏰ Current Time (JS):', new Date().toISOString());

  const result = await notificationQueueService.processQueue(1);

  console.log('📊 Processing Result:', result);

  // 4. Verify Outcome
  const { data: updatedItem } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('id', queueItem.id)
    .single();

  console.log('🏁 Final Item Status:', updatedItem?.status);
  console.log(
    '📜 Execution Log:',
    JSON.stringify(updatedItem?.execution_log, null, 2),
  );

  if (updatedItem?.status === 'completed') {
    console.log('✅ Test PASSED: Notification processed successfully.');
  } else {
    console.log('❌ Test FAILED: Notification failed or skipped.');
  }
}

main().catch(console.error);
