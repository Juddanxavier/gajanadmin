/** @format */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function assignUserToTenants() {
  console.log('👤 Assigning Global Admin to Tenants\n');

  try {
    // Get the global admin user
    console.log('1️⃣ Finding global admin...');
    const { data: globalAdmin, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .is('tenant_id', null)
      .single();

    if (adminError || !globalAdmin) {
      console.error('❌ No global admin found!');
      console.log("Run: SELECT make_super_admin('your-email@example.com');");
      process.exit(1);
    }

    console.log(`✅ Global Admin User ID: ${globalAdmin.user_id}`);

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', globalAdmin.user_id)
      .single();

    console.log(`   Email: ${profile?.email || 'Unknown'}`);

    // Get all tenants
    console.log('\n2️⃣ Fetching tenants...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, slug');

    if (tenantsError || !tenants || tenants.length === 0) {
      console.error('❌ No tenants found!');
      process.exit(1);
    }

    console.log(`✅ Found ${tenants.length} tenant(s):`);
    tenants.forEach((t) => console.log(`   - ${t.name} (${t.slug})`));

    // Assign user to all tenants
    console.log('\n3️⃣ Assigning user to tenants...');

    for (const tenant of tenants) {
      const { error: assignError } = await supabase.from('user_tenants').upsert(
        {
          user_id: globalAdmin.user_id,
          tenant_id: tenant.id,
        },
        {
          onConflict: 'user_id,tenant_id',
          ignoreDuplicates: true,
        },
      );

      if (assignError) {
        console.log(`⚠️  ${tenant.name}: ${assignError.message}`);
      } else {
        console.log(`✅ ${tenant.name} (${tenant.slug})`);
      }
    }

    // Verify assignments
    console.log('\n4️⃣ Verifying assignments...');
    const { data: assignments, error: verifyError } = await supabase
      .from('user_tenants')
      .select(
        `
        tenant_id,
        tenants (name, slug)
      `,
      )
      .eq('user_id', globalAdmin.user_id);

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError.message);
    } else {
      console.log(`✅ User assigned to ${assignments?.length || 0} tenant(s):`);
      assignments?.forEach((a: any) => {
        console.log(`   - ${a.tenants.name} (${a.tenants.slug})`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 ASSIGNMENT SUMMARY');
    console.log('='.repeat(70));
    console.log('User:', profile?.email || globalAdmin.user_id);
    console.log('Role: Global Admin');
    console.log('Tenants Assigned:', assignments?.length || 0);
    console.log('Status: ✅ Complete');
    console.log('='.repeat(70));

    console.log('\n💡 The global admin now has access to:');
    console.log('   - All data across ALL tenants (via is_admin() function)');
    console.log('   - Tenant-specific views for India and Sri Lanka');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

assignUserToTenants();
