/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debug() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  console.log('🔍 Debugging Email Config...');

  // 1. Get the latest shipment to get a real tenant_id
  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .select('id, tenant_id, carrier_tracking_code')
    .limit(1)
    .order('created_at', { ascending: false })
    .single();

  if (shipmentError || !shipment) {
    console.error('❌ Could not fetch shipment:', shipmentError);
    return;
  }

  console.log(`📦 Shipment: ${shipment.id}`);
  console.log(`🏢 Tenant ID: ${shipment.tenant_id}`);

  // 2. Check config for this tenant
  const { data: config, error: configError } = await supabase
    .from('tenant_notification_configs')
    .select('*')
    .eq('tenant_id', shipment.tenant_id)
    .eq('channel', 'email');

  if (configError) {
    console.error('❌ Error fetching config:', configError);
  } else if (!config || config.length === 0) {
    console.log('⚠️ No email config found for this tenant!');
  } else {
    console.log('✅ Config found:', JSON.stringify(config, null, 2));
  }

  // 3. List all configs to see what exists
  const { data: allConfigs } = await supabase
    .from('tenant_notification_configs')
    .select('tenant_id, channel, is_active');

  console.log('📋 All Notification Configs:', allConfigs);
}

debug();
