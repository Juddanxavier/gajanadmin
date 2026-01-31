/** @format */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 1. Configure Environment BEFORE imports
// Load .env.local first (Next.js convention)
dotenv.config({ path: '.env.local' });
// Load .env as fallback
dotenv.config();

// MOCK CONSTANTS
const MOCK_TENANT_ID = process.argv[2] ?? 'your-tenant-id-here';
const TEST_TRACKING_NO = `TEST-${Date.now()}`;
const TEST_PHONE = '+1234567890';
const TEST_EMAIL = 'test@example.com';

async function main() {
  console.log('🚀 Starting System Test...\n');

  // Debug: Check if Env loaded
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ Environment variables not loaded correctly.');
    console.error('Current PWD:', process.cwd());
    console.error('Tried loading .env.local and .env');
    process.exit(1);
  }

  // 2. DYNAMIC IMPORTS
  // We import these HERE so that they evaluate POST-dotenv config.
  // This bypasses the hoisting problem where 'lib/env.ts' would throw before we configured dotenv.
  const { ShipmentService } = await import('../lib/services/shipment-service');
  const { NotificationService } =
    await import('../lib/services/notification-service');

  // 3. Setup Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      '❌ Missing Environment Variables (SUPABASE_URL or SERVICE_KEY)',
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Services
  const shipmentService = new ShipmentService(supabase as any);
  const notificationService = new NotificationService(supabase as any);

  // Get a valid Tenant ID if not provided
  let tenantId = MOCK_TENANT_ID;
  if (tenantId === 'your-tenant-id-here') {
    const { data } = await supabase
      .from('tenants')
      .select('id')
      .limit(1)
      .single();
    if (data) {
      tenantId = data.id;
      console.log(`ℹ️ Auto-detected Tenant ID: ${tenantId}`);
    } else {
      console.error('❌ No tenants found in database. Cannot proceed.');
      process.exit(1);
    }
  }

  try {
    // --- STEP 1: CREATE SHIPMENT ---
    console.log(
      `\n📦 [Step 1] Creating Test Shipment (${TEST_TRACKING_NO})...`,
    );
    const shipment = await shipmentService.createShipment({
      tracking_number: TEST_TRACKING_NO,
      carrier_code: 'dhl',
      customer_name: 'Test Runner',
      customer_email: TEST_EMAIL,
      customer_phone: TEST_PHONE,
      tenantId: tenantId,
      provider: 'track123',
    });
    console.log(`✅ Shipment Created! ID: ${shipment.id}`);

    // --- STEP 2: SIMULATE WEBHOOK / UPDATE ---
    console.log(`\n🔄 [Step 2] Simulating Tracking Update (Webhook)...`);
    const webhookPayload = {
      trackNo: TEST_TRACKING_NO,
      transitStatus: 'DELIVERED',
      localLogisticsInfo: {
        courierCode: 'dhl',
        trackingDetails: [
          {
            eventTime: new Date().toISOString(),
            eventDetail: 'Delivered to recipient',
            transitSubStatus: 'Delivered',
            address: 'Test City, TS',
          },
        ],
      },
      estimatedDelivery: new Date().toISOString(),
    };

    await shipmentService.processWebhook(webhookPayload, tenantId);
    console.log(`✅ Webhook Processed. Shipment should be 'delivered'.`);

    // --- STEP 3: TRIGGER NOTIFICATION ---
    console.log(`\n🔔 [Step 3] Triggering Notification (Manual)...`);
    const notifResult = await notificationService.sendNotifications({
      shipmentId: shipment.id,
      tenantId: tenantId,
      recipientEmail: TEST_EMAIL,
      recipientPhone: TEST_PHONE,
      recipientName: 'Test Runner',
      trackingCode: TEST_TRACKING_NO,
      referenceCode: `REF-${Date.now()}`,
      status: 'delivered',
      deliveryDate: new Date().toISOString(),
      invoiceAmount: 100, // Optional dummy
      invoiceCurrency: 'USD',
    });

    console.log(
      '📡 Notification Result:',
      JSON.stringify(notifResult, null, 2),
    );

    if (notifResult.email?.success || notifResult.whatsapp?.success) {
      console.log('✅ Notifications dispatched successfully.');
    } else {
      console.warn('⚠️ Notifications info: check output above.');
    }

    // --- STEP 4: CLEANUP ---
    console.log(`\n🧹 [Step 4] Cleaning up...`);
    await shipmentService.deleteShipment(shipment.id, false);
    console.log(`✅ Test Shipment deleted.`);

    console.log(`\n🎉 Test Complete! System appears functional.`);
  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.response) console.error(error.response);
  }
}

main();
