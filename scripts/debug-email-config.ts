/** @format */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1);
  if (!tenants || tenants.length === 0) {
    console.log('No tenants found.');
    return;
  }
  const tenantId = tenants[0].id; // Assuming we are testing with the first tenant

  console.log(`Checking config for Tenant: ${tenantId} (${tenants[0].name})`);

  const { data: config, error } = await supabase
    .from('tenant_notification_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('channel', 'email')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching config:', error.message);
  } else {
    console.log('Current Active Email Config:', config);
    if (config.provider_id === 'smtp') {
      console.log(
        '⚠️  Provider is set to SMTP. If you want ZeptoMail, Update this config.',
      );
      console.log('SMTP User:', config.credentials?.user);
      // Don't log pass obviously
    } else if (config.provider_id === 'zeptomail') {
      console.log('✅ Provider is set to ZeptoMail.');
    }
  }
}

main();
