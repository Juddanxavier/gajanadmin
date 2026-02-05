/** @format */

import { createClient } from '@supabase/supabase-js';
import { EmailService } from '../lib/services/email-notification-service';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
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
  const emailService = new EmailService(supabase);

  // Parse args
  const targetEmail = process.argv[2];
  if (!targetEmail) {
    console.error('❌ Please provide a target email address.');
    console.log('Usage: npx tsx scripts/test-email-notification.ts <email>');
    process.exit(1);
  }

  console.log('🔍 Finding a recent shipment to use as context...');

  const { data: shipment, error } = await supabase
    .from('shipments')
    .select('*')
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
  console.log(`📧 Sending test email to: ${targetEmail}`);

  // Use 'out_for_delivery' to trigger a standard template
  const testStatus = 'out_for_delivery';

  const result = await emailService.sendShipmentNotification({
    shipmentId: shipment.id,
    tenantId: shipment.tenant_id,
    status: testStatus,
    recipientEmail: targetEmail,
    recipientName: 'Test User',
    trackingCode: shipment.carrier_tracking_code,
    referenceCode: shipment.white_label_code,
    invoiceAmount: 1500, // Mock amount
    invoiceCurrency: 'INR',
    deliveryDate: new Date().toISOString(),
  });

  if (result.success) {
    console.log('✅ Result:', result.message);
    if (result.logId) console.log('📝 Log ID:', result.logId);

    if (result.message.includes('duplicate')) {
      console.log(
        '⚠️ Note: This was flagged as a duplicate because a similar notification was sent recently.',
      );
      console.log(
        'To bypass, wait 24h or manually delete the log entry in "notification_logs".',
      );
    }
  } else {
    console.error('❌ Failed to send email:', result.message);
  }
}

main().catch((err) => {
  console.error('❌ Critical Error:', err);
  process.exit(1);
});
