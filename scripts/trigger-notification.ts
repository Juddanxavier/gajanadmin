/** @format */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// --- Load Env (Manual) ---
const envPath = path.resolve(process.cwd(), '.env.local');
const env: Record<string, string> = {};
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
  });
}

const supabaseUrl =
  env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('🚀 Triggering Notification Test...');

  // 1. Find the Mock Shipment (created by seed-mock-shipment.ts)
  // We look for the one we know: carrier_tracking_code="TEST-NOTIF-4691" (or just verify via inspect)
  // Actually, simpler to pick the most recent one.

  const { data: shipments, error: fetchErr } = await supabase
    .from('shipments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchErr || !shipments || shipments.length === 0) {
    console.error(
      '❌ No shipments found to test with. Run seed-mock-shipment.ts first.',
    );
    return;
  }

  const shipment = shipments[0];
  console.log(`Found Shipment: ${shipment.id} (Status: ${shipment.status})`);

  // 2. Update Status to 'out_for_delivery' to trigger notification
  // Note: NotificationService logic requires status CHANGE.
  // If it's already 'out_for_delivery', let's flip it to 'delivered' or back to 'in_transit'.

  let newStatus = 'out_for_delivery';
  if (shipment.status === 'out_for_delivery') newStatus = 'delivered';
  if (shipment.status === 'delivered') newStatus = 'out_for_delivery'; // Loop back to a valid trigger status

  console.log(`Updating Status: ${shipment.status} -> ${newStatus}`);

  // We must use the SERVICE logic to ensure notification is triggered.
  // However, updating DB directly via Superviser Client might not trigger logic if logic is in Next.js Server Action / Service?
  // Wait! logic is in `lib/tracking/service.ts`.
  // We can simulate the tracking update call or just call NotificationService directly.

  // Calling NotificationService directly is cleaner for unit-testing the NOTIFICATION (skipping tracking update logic).

  // Import NotificationService dynamically (it uses env vars we might need to mock if not in Next.js)
  // Actually, since this is a script, we can just instantiate it.
  // BUT NotificationService imports `createAdminClient` which reads process.env.
  // We used manual env loading here, but process.env might be empty for the imported module.
  // Let's populate process.env manually first.

  Object.assign(process.env, env); // Inject loaded envs into process.env for imported modules

  try {
    const { NotificationService } =
      await import('../lib/services/notification-service');
    const notifier = new NotificationService(supabase);

    await notifier.sendNotifications({
      shipmentId: shipment.id,
      tenantId: shipment.tenant_id,
      status: newStatus,
      recipientEmail: 'juddan2008@gmail.com',
      recipientName: shipment.customer_details?.name || 'Test Customer',
      trackingCode: shipment.carrier_tracking_code,
      referenceCode: shipment.reference_code || shipment.carrier_tracking_code,
      location: 'Test City, XY',
    });

    // 3. Update DB status to match (optional, but good for consistency)
    await supabase
      .from('shipments')
      .update({ status: newStatus })
      .eq('id', shipment.id);

    console.log('✅ Notification Triggered & Status Updated!');
    console.log('Check your SMTP logs / Inbox to verify.');
  } catch (e) {
    console.error('❌ Error triggering notification:', e);
  }
}

run();
