/** @format */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGetAllTenants() {
  console.log('🧪 Testing getAllTenants() function\n');

  try {
    // Simulate what the client does
    console.log('1️⃣ Testing with service role key (should work)...');
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, country_code')
      .order('name');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Success! Found', data?.length || 0, 'tenants:');
    data?.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.name} (${t.country_code})`);
      console.log(`      ID: ${t.id}`);
    });

    console.log('\n2️⃣ Testing RLS policies...');
    console.log(
      '   The getAllTenants() server action should use createClient()',
    );
    console.log('   which respects RLS policies.');
    console.log('   If tenants are not loading in the UI, check:');
    console.log('   - User is authenticated');
    console.log('   - User has is_admin() = true');
    console.log('   - RLS policy allows admin to SELECT from tenants');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testGetAllTenants();
