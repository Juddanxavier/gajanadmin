/** @format */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('🔍 Checking users in database...\n');

  // Check auth.users
  const { data: authUsers, error: authError } =
    await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error fetching auth users:', authError);
  } else {
    console.log(`📊 Auth Users: ${authUsers.users.length}`);
    authUsers.users.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} (${u.id})`);
    });
  }

  // Check profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, display_name');

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError);
  } else {
    console.log(`\n📊 Profiles: ${profiles?.length || 0}`);
    profiles?.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.email} - ${p.display_name || 'No name'}`);
    });
  }

  // Check user_roles
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role, tenant_id');

  if (rolesError) {
    console.error('❌ Error fetching user_roles:', rolesError);
  } else {
    console.log(`\n📊 User Roles: ${roles?.length || 0}`);
    roles?.forEach((r, i) => {
      console.log(
        `   ${i + 1}. User: ${r.user_id.substring(0, 8)}... Role: ${r.role} Tenant: ${r.tenant_id || 'global'}`,
      );
    });
  }

  // Check user_tenants
  const { data: userTenants, error: tenantsError } = await supabase
    .from('user_tenants')
    .select('user_id, tenant_id');

  if (tenantsError) {
    console.error('❌ Error fetching user_tenants:', tenantsError);
  } else {
    console.log(`\n📊 User Tenants: ${userTenants?.length || 0}`);
    userTenants?.forEach((ut, i) => {
      console.log(
        `   ${i + 1}. User: ${ut.user_id.substring(0, 8)}... Tenant: ${ut.tenant_id.substring(0, 8)}...`,
      );
    });
  }

  // Try the actual query used by the app
  console.log('\n🔍 Testing app query...');
  const { data: appQuery, error: appError } = await supabase.from('profiles')
    .select(`
      id,
      email,
      display_name,
      full_name,
      avatar_url,
      phone,
      created_at,
      updated_at,
      last_sign_in_at,
      user_roles (
        role,
        tenant_id
      ),
      user_tenants (
        tenant_id,
        tenants (
          id,
          name,
          slug,
          country_code
        )
      )
    `);

  if (appError) {
    console.error('❌ App query error:', appError);
  } else {
    console.log(`✅ App query returned ${appQuery?.length || 0} users`);
    appQuery?.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email}`);
      console.log(`      Roles: ${JSON.stringify(u.user_roles)}`);
      console.log(`      Tenants: ${JSON.stringify(u.user_tenants)}`);
    });
  }
}

checkUsers();
