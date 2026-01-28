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
  console.log('--- 🔍 Notification System Audit ---');

  // 1. Check Recent Notifications
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching notifications:', error.message);
    return;
  }

  console.log(`\nFound ${notifications?.length || 0} recent notifications:`);

  notifications?.forEach((n) => {
    const status = n.sent_at ? '✅ SENT' : n.error ? '❌ FAILED' : '⏳ PENDING';
    console.log(`\n[${status}] ID: ${n.id}`);
    console.log(`  Type: ${n.type}`);
    console.log(`  Recipient: ${n.recipient_email}`);
    console.log(`  Created: ${new Date(n.created_at).toLocaleString()}`);
    if (n.sent_at)
      console.log(`  Sent: ${new Date(n.sent_at).toLocaleString()}`);
    if (n.scheduled_for)
      console.log(`  Scheduled: ${new Date(n.scheduled_for).toLocaleString()}`);
    if (n.retry_count > 0) console.log(`  Retries: ${n.retry_count}`);
    if (n.error) console.log(`  Error: ${n.error}`);
  });

  // 2. Check Environment Variables (Masked)
  console.log('\n--- ⚙️ Configuration Check ---');
  console.log(
    `RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Configured' : '❌ Missing'}`,
  );
  console.log(
    `NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || '❌ Missing'}`,
  );
  console.log(
    `CRON_SECRET: ${process.env.CRON_SECRET ? '✅ Configured' : '❌ Missing'}`,
  );

  // 3. Check Tenant Settings Sample
  if (notifications && notifications.length > 0) {
    const tenantId = notifications[0].tenant_id;
    const { data: settings } = await supabase
      .from('settings')
      .select('email_notifications_enabled, email_provider')
      .eq('tenant_id', tenantId)
      .single();

    console.log(`\n--- 🏢 Tenant Settings (ID: ${tenantId}) ---`);
    if (settings) {
      console.log(`Email Enabled: ${settings.email_notifications_enabled}`);
      console.log(`Provider: ${settings.email_provider || 'Default (Resend)'}`);
    } else {
      console.log('❌ Tenant settings not found');
    }
  }
}

run();
