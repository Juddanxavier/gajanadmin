/** @format */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateTenantNames() {
  console.log('🔄 Updating tenant names to "India" and "Sri Lanka"\n');

  try {
    // Update India tenant
    const { data: indiaData, error: indiaError } = await supabase
      .from('tenants')
      .update({ name: 'India' })
      .eq('slug', 'india')
      .select();

    if (indiaError) {
      console.error('❌ Error updating India tenant:', indiaError);
    } else {
      console.log('✅ Updated India tenant:', indiaData);
    }

    // Update Sri Lanka tenant
    const { data: sriLankaData, error: sriLankaError } = await supabase
      .from('tenants')
      .update({ name: 'Sri Lanka' })
      .eq('slug', 'sri-lanka')
      .select();

    if (sriLankaError) {
      console.error('❌ Error updating Sri Lanka tenant:', sriLankaError);
    } else {
      console.log('✅ Updated Sri Lanka tenant:', sriLankaData);
    }

    // Verify changes
    console.log('\n📋 Current tenants:');
    const { data: allTenants, error: fetchError } = await supabase
      .from('tenants')
      .select('id, name, slug, country_code')
      .order('name');

    if (fetchError) {
      console.error('❌ Error fetching tenants:', fetchError);
    } else {
      allTenants?.forEach((tenant, i) => {
        console.log(`   ${i + 1}. ${tenant.name}`);
        console.log(`      Slug: ${tenant.slug}`);
        console.log(`      Country: ${tenant.country_code}`);
        console.log(`      ID: ${tenant.id}`);
        console.log();
      });
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

updateTenantNames();
