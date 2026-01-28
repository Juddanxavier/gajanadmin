/** @format */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFKs() {
  console.log('🔍 Verifying Foreign Keys on user_roles and user_tenants...\n');

  // We can't always query information_schema via API directly if permissions are tight.
  // But we can try to "EXPLAIN" a query or just deduce from behavior.
  // Actually, we can try to query `user_roles` selecting `profiles` relation.
  // If it works, relationship exists. If error, it matches.

  const { data, error } = await supabase
    .from('user_roles')
    .select('id, user_id, profiles(email)')
    .limit(1);

  if (error) {
    console.log('❌ Foreign Key Check Failed!');
    console.log('   Error Code:', error.code);
    console.log('   Message:', error.message);
    console.log('   Hint:', error.hint);

    if (error.message.includes('Could not find a relationship')) {
      console.log(
        '\n👉 CONCLUSION: The Foreign Key between user_roles and profiles is MISSING.',
      );
    }
  } else {
    console.log('✅ relationship `profiles` found on `user_roles`.');
  }

  const { data: tenantData, error: tenantError } = await supabase
    .from('user_tenants')
    .select('id, user_id, profiles(email)')
    .limit(1);

  if (tenantError) {
    console.log('\n❌ Foreign Key Check (user_tenants) Failed!');
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

verifyFKs();
