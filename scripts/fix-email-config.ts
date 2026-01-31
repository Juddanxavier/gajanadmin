/** @format */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // 1. Get Tenant
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1);
  if (!tenants || tenants.length === 0) {
    console.log('No tenants found.');
    return;
  }
  const tenantId = tenants[0].id;
  console.log(`Updating config for Tenant: ${tenantId} (${tenants[0].name})`);

  // 2. Fetch current config to invoke update
  const { data: config } = await supabase
    .from('tenant_notification_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('channel', 'email')
    .single();

  if (!config) {
    console.error('No config found to update.');
    return;
  }

  // 3. Update to ZeptoMail
  const { error } = await supabase
    .from('tenant_notification_configs')
    .update({
      provider_id: 'zeptomail', // Switch from 'smtp' to 'zeptomail'
      config: {
        ...config.config,
        from_name: config.config.from_name || 'Gajan Traders', // Fix empty name
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', config.id);

  if (error) {
    console.error('❌ Failed to update config:', error.message);
  } else {
    console.log('✅ Configuration/Provider updated to ZeptoMail.');
    console.log('Run the test script again to verify sending.');
  }
}

main();
