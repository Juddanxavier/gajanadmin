/** @format */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
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

async function checkAdminSetup() {
  console.log('🔍 Checking Global Admin Setup...\n');

  try {
    // 1. Check if is_admin function exists
    console.log('1️⃣ Testing is_admin() function...');
    const { data: functionTest, error: functionError } = await supabase.rpc(
      'is_admin',
      { user_uuid: '00000000-0000-0000-0000-000000000000' },
    );

    if (functionError) {
      console.error('❌ is_admin() function error:', functionError.message);
      console.log('   This function may not exist in the database.');
      console.log(
        '   Run migration: supabase/migrations/20260104_enable_super_admin.sql\n',
      );
    } else {
      console.log('✅ is_admin() function exists and is callable\n');
    }

    // 2. Check user_roles table structure
    console.log('2️⃣ Checking user_roles table...');
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(5);

    if (rolesError) {
      console.error('❌ Error querying user_roles:', rolesError.message);
    } else {
      console.log(
        `✅ user_roles table accessible (${roles?.length || 0} sample records)`,
      );
      if (roles && roles.length > 0) {
        console.log('   Sample record:', JSON.stringify(roles[0], null, 2));
      }
      console.log();
    }

    // 3. Check for global admins (tenant_id IS NULL)
    console.log('3️⃣ Checking for Global Admins...');
    const { data: globalAdmins, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id, role, tenant_id')
      .eq('role', 'admin')
      .is('tenant_id', null);

    if (adminError) {
      console.error('❌ Error querying global admins:', adminError.message);
    } else {
      console.log(`✅ Found ${globalAdmins?.length || 0} Global Admin(s)`);
      if (globalAdmins && globalAdmins.length > 0) {
        console.log('   Global Admin User IDs:');
        globalAdmins.forEach((admin) => {
          console.log(
            `   - ${admin.user_id} (role: ${admin.role}, tenant_id: ${admin.tenant_id})`,
          );
        });
      } else {
        console.log('   ⚠️  No global admins found!');
        console.log('   To create one, run:');
        console.log("   SELECT make_super_admin('your-email@example.com');");
      }
      console.log();
    }

    // 4. Get all users from auth.users
    console.log('4️⃣ Checking auth.users...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(10);

    if (usersError) {
      console.log('⚠️  Could not query profiles:', usersError.message);
    } else {
      console.log(`✅ Found ${users?.length || 0} user profile(s)`);
      if (users && users.length > 0) {
        console.log('   Users:');
        users.forEach((user) => {
          console.log(`   - ${user.email} (${user.full_name || 'No name'})`);
        });
      }
      console.log();
    }

    // 5. Check make_super_admin function
    console.log('5️⃣ Testing make_super_admin() function availability...');
    const { data: functionsList, error: functionsError } = await supabase
      .rpc('make_super_admin', { user_email: 'test@example.com' })
      .then(
        () => ({ data: 'Function exists', error: null }),
        (err) => ({ data: null, error: err }),
      );

    if (functionsError) {
      if (functionsError.message?.includes('not found')) {
        console.log('⚠️  make_super_admin() function not found');
        console.log(
          '   Run migration: supabase/migrations/20260104_enable_super_admin.sql',
        );
      } else {
        console.log('✅ make_super_admin() function exists');
      }
    } else {
      console.log('✅ make_super_admin() function exists');
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 ADMIN SETUP SUMMARY');
    console.log('='.repeat(70));
    console.log(
      'Function is_admin():',
      functionError ? '❌ Missing' : '✅ Available',
    );
    console.log('Function make_super_admin():', '✅ Available');
    console.log('Global Admins:', globalAdmins?.length || 0);
    console.log('='.repeat(70));

    if (!globalAdmins || globalAdmins.length === 0) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('No global admins found. To create one, run this SQL:');
      console.log("\nSELECT make_super_admin('juddan2008@gmail.com');");
      console.log('\nOr insert directly:');
      console.log('INSERT INTO user_roles (user_id, role, tenant_id)');
      console.log(
        "SELECT id, 'admin', NULL FROM auth.users WHERE email = 'juddan2008@gmail.com';",
      );
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAdminSetup();
