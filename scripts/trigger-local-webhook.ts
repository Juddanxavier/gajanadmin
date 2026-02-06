/**
 * Simulate Webhook Trigger Locally
 *
 * Usage: npx tsx scripts/trigger-local-webhook.ts <SHIPMENT_ID> <NEW_STATUS> [OLD_STATUS]
 * Example: npx tsx scripts/trigger-local-webhook.ts 123e4567-e89b-12d3-a456-426614174000 delivered out_for_delivery
 *
 * @format
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must act as admin/service to read data
const webhookSecret =
  process.env.NOTIFICATION_WEBHOOK_SECRET || process.env.CRON_SECRET;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase Credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      'Usage: npx tsx scripts/trigger-local-webhook.ts <SHIPMENT_ID> <NEW_STATUS> [OLD_STATUS]',
    );
    process.exit(1);
  }

  const [shipmentId, newStatus, oldStatusArg] = args;
  const oldStatus = oldStatusArg || 'processing'; // default fallback

  console.log(`Fetching shipment ${shipmentId}...`);

  // 1. Fetch Shipment Data to build payload
  const { data: shipment, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('id', shipmentId)
    .single();

  if (error || !shipment) {
    console.error('Shipment not found:', error?.message);
    process.exit(1);
  }

  // 2. Build Payload (matching plpgsql trigger logic)
  const payload = {
    shipment_id: shipment.id,
    tenant_id: shipment.tenant_id,
    old_status: oldStatus,
    new_status: newStatus,
    tracking_code: shipment.carrier_tracking_code,
    reference_code: shipment.white_label_code,
    customer_email: shipment.customer_details?.email,
    customer_name: shipment.customer_details?.name,
    invoice_amount: shipment.invoice_details?.amount,
    invoice_currency: shipment.invoice_details?.currency,
    delivery_date: shipment.raw_response?.estimated_delivery,
  };

  if (!payload.customer_email) {
    console.warn(
      'Warning: Shipment has no customer email. Webhook might incorrectly skip or queue without recipient.',
    );
  }

  // 3. Send to Localhost
  const localUrl = 'http://localhost:3000/api/webhooks/internal/notifications';
  console.log(`Sending Webhook to: ${localUrl}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(localUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${webhookSecret}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('\nResponse Status:', response.status);
    console.log('Response Body:', result);

    if (response.ok) {
      console.log('\n✅ Success! Notification queued locally.');
    } else {
      console.error('\n❌ Failed.');
    }
  } catch (err: any) {
    console.error('Request failed. Is your local server running?');
    console.error('Error:', err.message);
  }
}

run();
