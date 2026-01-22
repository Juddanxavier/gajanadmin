/**
 * Update Tenant Names
 *
 * This script updates tenant names to "India" and "Sri Lanka"
 *
 * Run with: npm run update-tenant-names
 *
 * @format
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function updateTenantNames() {
  console.log('🔄 Updating tenant names...\n');

  const adminClient = createAdminClient();

  try {
    // Update India
    const { data: indiaData, error: indiaError } = await adminClient
      .from('tenants')
      .update({ name: 'India' })
      .eq('slug', 'india')
      .select();

    if (indiaError) {
      console.error('❌ Error updating India:', indiaError);
      return;
    }

    console.log('✅ Updated India tenant');

    // Update Sri Lanka
    const { data: sriLankaData, error: sriLankaError } = await adminClient
      .from('tenants')
      .update({ name: 'Sri Lanka' })
      .eq('slug', 'sri-lanka')
      .select();

    if (sriLankaError) {
      console.error('❌ Error updating Sri Lanka:', sriLankaError);
      return;
    }

    console.log('✅ Updated Sri Lanka tenant');

    // Verify
    const { data: tenants } = await adminClient
      .from('tenants')
      .select('id, name, slug, country_code')
      .order('name');

    console.log('\n📋 Current tenants:');
    tenants?.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.name} (${t.country_code})`);
    });

    console.log('\n✅ Tenant names updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateTenantNames();
