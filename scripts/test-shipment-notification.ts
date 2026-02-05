/** @format */

import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '../lib/services/notification-service';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error(
      'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.',
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const notificationService = new NotificationService(supabase);

  // Parse args
  const targetEmail = process.argv[2];
  if (!targetEmail) {
    console.error('❌ Please provide a target email address.');
    console.log(
      'Usage: npx tsx scripts/test-shipment-notification.ts <email> [phone]',
    );
    process.exit(1);
  }

  const targetPhone = process.argv[3]; // Optional phone number for WhatsApp test

  console.log('🔍 Finding a recent shipment to use as context...');

  const { data: shipment, error } = await supabase
    .from('shipments')
    .select('*, tenant:tenants(name)')
    .limit(1)
    .order('created_at', { ascending: false })
    .single();

  if (error || !shipment) {
    console.error('❌ No shipments found in database to test with.');
    console.error(error);
    process.exit(1);
  }

  console.log(
    `📦 Using Shipment: ${shipment.carrier_tracking_code} (${shipment.id})`,
  );
  console.log(`📧 Email Recipient: ${targetEmail}`);
  if (targetPhone) console.log(`📱 Phone Recipient: ${targetPhone}`);

  // Test Payload
  const testStatus = 'out_for_delivery';

  console.log(`🚀 Dispatching notification for status: ${testStatus}...`);

  const results = await notificationService.sendNotifications({
    shipmentId: shipment.id,
    tenantId: shipment.tenant_id,
    status: testStatus,
    recipientEmail: targetEmail,
    recipientPhone: targetPhone, // Pass phone if provided
    recipientName: 'Test User',
    trackingCode: shipment.carrier_tracking_code,
    referenceCode: shipment.white_label_code,
    invoiceAmount: 1500,
    invoiceCurrency: 'INR',
    deliveryDate: new Date().toISOString(),
    tenantName: shipment.tenant?.name || 'Gajan Logistics',
    location: 'Mumbai Hub',
    updatedAt: new Date().toISOString(),
  });

  console.log('\n📊 Notification Results:');
  console.log(JSON.stringify(results, null, 2));

  if (results.email?.success) console.log('✅ Email: SUCCESS');
  else if (results.email?.skipped) console.log('⚠️ Email: SKIPPED');
  else console.log('❌ Email: FAILED');

  if (results.whatsapp?.success) console.log('✅ WhatsApp: SUCCESS');
  else if (results.whatsapp) console.log('❌ WhatsApp: FAILED');
}

main().catch((err) => {
  console.error('❌ Critical Error:', err);
  process.exit(1);
});
