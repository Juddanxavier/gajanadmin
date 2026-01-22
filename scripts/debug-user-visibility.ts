/** @format */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUsers() {
  console.log('🔍 Debugging User Data Visibility...\n');

  // 1. Check if Foreign Keys exist
  console.log('1️⃣ Checking Foreign Keys...');
  const { data: fks, error: fkError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT 
            tc.table_name, 
            kcu.column_name,
            ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name IN ('user_roles', 'user_tenants');
      `,
    })
    .catch(() => ({ data: null, error: 'RPC exec_sql not available' }));

  if (fkError)
    console.log(
      '   ⚠️ Could not verify FKs via RPC (expected if function missing)',
    );

  // 2. Try the App Query (Simulated)
  console.log('\n2️⃣ Testing App Query (Join Profiles + Roles)...');
  const { data: appData, error: appError } = await supabase
    .from('profiles')
    .select(
      `
      id,
      email,
      user_roles (
        role,
        tenant_id
      )
    `,
    )
    .limit(5);

  if (appError) {
    console.error('   ❌ Query FAILED:', appError.message);
    console.log(
      '   👉 This confirms the Foreign Key is likely still missing or RLS is blocking.',
    );
  } else {
    console.log(`   ✅ Query SUCCEEDED. Rows returned: ${appData.length}`);
    if (appData.length === 0)
      console.log(
        '   ⚠️ No rows returned. Table might be empty or RLS hiding data.',
      );
    else console.log('   📄 Sample Data:', JSON.stringify(appData[0], null, 2));
  }

  // 3. Check Raw Tables (Admin Access)
  console.log('\n3️⃣ Checking Raw Tables (Admin Access)...');
  const { count: profileCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  const { count: roleCount } = await supabase
    .from('user_roles')
    .select('*', { count: 'exact', head: true });

  console.log(`   profiles count: ${profileCount}`);
  console.log(`   user_roles count: ${roleCount}`);

  if (profileCount > 0 && appError) {
    console.log(
      '\n🚨 CONCLUSION: Data exists but Query Fails -> FK Relationship Missing.',
    );
  } else if (profileCount > 0 && appData && appData.length === 0) {
    console.log(
      '\n🚨 CONCLUSION: Data exists, Query runs, but returns nothing -> RLS Policy Issue.',
    );
  } else {
    console.log('\n❓ CONCLUSION: Further investigation needed.');
  }
}

debugUsers();
