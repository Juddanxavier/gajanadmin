/** @format */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
try {
  const envConfig = readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
} catch (e) {
  console.log('Could not read .env.local');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Triggering Mock Notification ---');

  // 1. Get the Mock Shipment
  // We'll look for the shipment we just created (provider=track123, status=pending, tracking starts with MOCK)
  const { data: shipment, error: findError } = await supabase
    .from('shipments')
    .select('*')
    .ilike('carrier_tracking_code', 'MOCK-%')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (findError || !shipment) {
    console.error(
      'Could not find the mock shipment. Please run create-mock-shipment.ts first.',
    );
    return;
  }

  console.log(
    `Found Shipment: ${shipment.carrier_tracking_code} (${shipment.id})`,
  );

  // 2. Check/Ensure Settings
  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('*')
    .eq('tenant_id', shipment.tenant_id)
    .single();

  if (!settings) {
    console.log('Settings not found for tenant, creating defaults...');
    await supabase.from('settings').insert({
      tenant_id: shipment.tenant_id,
      email_notifications_enabled: true,
      company_name: 'Gajan Logistics',
      notification_triggers: [
        'pending',
        'info_received',
        'delivered',
        'exception',
        'out_for_delivery',
        'failed',
        'all',
      ],
    });
  } else {
    console.log(
      'Settings found. Email Enabled:',
      settings.email_notifications_enabled,
    );
    if (!settings.email_notifications_enabled) {
      console.log(
        '⚠️ WARNING: Email notifications are disabled in settings. Enabling them...',
      );
      await supabase
        .from('settings')
        .update({ email_notifications_enabled: true })
        .eq('id', settings.id);
    }
  }

  // 3. Queue Notification
  const scheduledFor = new Date().toISOString(); // Now

  const payload = {
    shipmentId: shipment.id,
    trackingCode: shipment.carrier_tracking_code,
    status: shipment.status,
    customerName: shipment.customer_details?.name || 'Test User',
    customerEmail: shipment.customer_details?.email,
    customerPhone: shipment.customer_details?.phone,
    location: shipment.latest_location,
  };

  const { data: notif, error: notifError } = await supabase
    .from('notifications')
    .insert({
      shipment_id: shipment.id,
      tenant_id: shipment.tenant_id,
      recipient_email: payload.customerEmail,
      type: 'status_change',
      data: payload,
      scheduled_for: scheduledFor,
      sent_at: null,
      retry_count: 0,
    })
    .select()
    .single();

  if (notifError) {
    console.error('Failed to queue notification:', notifError.message);
  } else {
    console.log('✅ Notification Queued Successfully!');
    console.log(`Notification ID: ${notif.id}`);
    console.log(`Scheduled For: ${scheduledFor}`);
    console.log(
      '\nTo process the queue, verify that your app or a cron job calls:',
    );
    console.log('POST /api/notifications/process-queue');
  }
}

run();
