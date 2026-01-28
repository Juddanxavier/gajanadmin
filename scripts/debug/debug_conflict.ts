/**
 * Debug Email Notifications
 * 
 * This script checks why emails are not being sent
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugEmailNotifications() {
  console.log('🔍 Debugging Email Notifications\n');

  // 1. Check if there are any shipments
  console.log('📋 Step 1: Checking shipments...\n');
  const { data: shipments, error: shipmentsError } = await supabase
    .from('shipments')
    .select('id, carrier_tracking_code, status, customer_details, tenant_id')
    .order('created_at', { ascending: false })
    .limit(5);

  if (shipmentsError) {
    console.error('❌ Error fetching shipments:', shipmentsError);
    return;
  }

  if (!shipments || shipments.length === 0) {
    console.log('⚠️  No shipments found. Create a shipment first!');
    return;
  }

  console.log(`✅ Found ${shipments.length} shipments:`);
  shipments.forEach(s => {
    console.log(`   - ${s.carrier_tracking_code} (${s.status})`);
    console.log(`     Customer email: ${s.customer_details?.email || 'MISSING ❌'}`);
    console.log(`     Tenant ID: ${s.tenant_id}`);
  });

  // 2. Check notification logs
  console.log('\n📋 Step 2: Checking notification logs...\n');
  const { data: logs, error: logsError } = await supabase
    .from('notification_logs')
    .select('*')
    .eq('type', 'email')
    .order('created_at', { ascending: false })
    .limit(10);

  if (logsError) {
    console.error('❌ Error fetching logs:', logsError);
  } else if (!logs || logs.length === 0) {
    console.log('⚠️  No notification logs found!');
    console.log('   This means the trigger is NOT firing or API is NOT being called.');
  } else {
    console.log(`✅ Found ${logs.length} notification logs:`);
    logs.forEach(log => {
      console.log(`   - ${log.subject} → ${log.recipient}`);
      console.log(`     Status: ${log.status}`);
      if (log.error_message) {
        console.log(`     Error: ${log.error_message}`);
      }
      console.log(`     Created: ${log.created_at}`);
    });
  }

  // 3. Check tenant notification configs
  console.log('\n📋 Step 3: Checking tenant email configurations...\n');
  
  const tenantIds = [...new Set(shipments.map(s => s.tenant_id))];
  
  for (const tenantId of tenantIds) {
    const { data: config, error: configError } = await supabase
      .from('tenant_notification_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('channel', 'email')
      .single();

    if (configError || !config) {
      console.log(`❌ Tenant ${tenantId}: NO EMAIL CONFIG FOUND!`);
      console.log('   → Go to Admin → Notification Settings to configure');
    } else {
      console.log(`✅ Tenant ${tenantId}:`);
      console.log(`   Provider: ${config.provider_id}`);
      console.log(`   From Email: ${config.config?.from_email || 'NOT SET'}`);
      console.log(`   From Name: ${config.config?.from_name || 'NOT SET'}`);
      console.log(`   Active: ${config.is_active ? '✅' : '❌ DISABLED'}`);
      console.log(`   API Key: ${config.credentials?.api_key ? '✅ Set' : '❌ MISSING'}`);
    }
  }

  // 4. Check environment variables
  console.log('\n📋 Step 4: Checking environment variables...\n');
  
  const webhookSecret = process.env.NOTIFICATION_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret === 'your-secret-key-change-this') {
    console.log('❌ NOTIFICATION_WEBHOOK_SECRET not set or using default!');
    console.log('   → Add to .env.local');
  } else {
    console.log('✅ NOTIFICATION_WEBHOOK_SECRET is set');
  }

  // 5. Test API endpoint
  console.log('\n📋 Step 5: Testing API endpoint...\n');
  
  const apiUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  console.log(`   API URL: ${apiUrl}/api/send-notification`);
  
  try {
    const testPayload = {
      shipment_id: shipments[0].id,
      tenant_id: shipments[0].tenant_id,
      old_status: 'pending',
      new_status: 'in_transit',
      carrier_tracking_code: shipments[0].carrier_tracking_code,
      white_label_code: 'TEST123',
      customer_details: shipments[0].customer_details,
      invoice_details: { amount: 99.99, currency: 'USD' },
    };

    console.log('\n   Sending test request...');
    const response = await fetch(`${apiUrl}/api/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`,
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ API responded successfully:', result);
    } else {
      console.log('❌ API error:', result);
    }
  } catch (error) {
    console.log('❌ Failed to call API:', error instanceof Error ? error.message : error);
    console.log('   → Make sure Next.js dev server is running: npm run dev');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log('\n✅ Checklist:');
  console.log('   [ ] Shipments exist with customer emails');
  console.log('   [ ] Tenant has email configuration (notification settings)');
  console.log('   [ ] NOTIFICATION_WEBHOOK_SECRET is set in .env.local');
  console.log('   [ ] Database trigger is configured (run migration)');
  console.log('   [ ] Next.js API is accessible');
  console.log('\n💡 Next Steps:');
  console.log('   1. Fix any ❌ issues above');
  console.log('   2. Run: npx tsx scripts/create-mock-shipment.ts');
  console.log('   3. Check notification_logs table');
  console.log('   4. Check Next.js terminal for API logs');
}

debugEmailNotifications()
  .then(() => {
    console.log('\n✅ Debug completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
