/**
 * Update Tenant Names - Simple Version
 *
 * Run with: node --env-file=.env.local --import=tsx scripts/update-tenant-names-simple.ts
 *
 * @format
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔄 Updating tenant names...\n');

  // Update India
  await supabase.from('tenants').update({ name: 'India' }).eq('slug', 'india');

  console.log('✅ Updated: India');

  // Update Sri Lanka
  await supabase
    .from('tenants')
    .update({ name: 'Sri Lanka' })
    .eq('slug', 'sri-lanka');

  console.log('✅ Updated: Sri Lanka');

  // Verify
  const { data } = await supabase
    .from('tenants')
    .select('name, slug')
    .order('name');

  console.log('\n📋 Current tenants:');
  data?.forEach((t) => console.log(`   - ${t.name} (${t.slug})`));

  console.log('\n✅ Done!');
}

main();
