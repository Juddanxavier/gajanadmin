/** @format */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTenantsFK() {
  console.log('🔍 Verifying user_tenants -> profiles relationship...\n');

  const { data: tenantData, error: tenantError } = await supabase
    .from('user_tenants')
    .select('user_id, profiles(email)')
    .limit(1);

  if (tenantError) {
    console.log('❌ Check Failed!');
    console.log('   Message:', tenantError.message);
    if (tenantError.message.includes('Could not find a relationship')) {
      console.log(
        '\n👉 CONCLUSION: The Foreign Key between user_tenants and profiles is MISSING.',
      );
    }
  } else {
    console.log('✅ relationship `profiles` found on `user_tenants`.');
  }
}

verifyTenantsFK();
