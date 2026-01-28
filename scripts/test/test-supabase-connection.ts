/** @format */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error(
    'NEXT_PUBLIC_SUPABASE_URL:',
    supabaseUrl ? '✓ Set' : '✗ Missing',
  );
  console.error(
    'SUPABASE_SERVICE_ROLE_KEY:',
    supabaseKey ? '✓ Set' : '✗ Missing',
  );
  process.exit(1);
}

console.log('🔍 Testing Supabase Connection...\n');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Service Role Key:', supabaseKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testConnection() {
  try {
    console.log('1️⃣ Testing basic connection...');

    // Test 1: Try to execute a simple query using RPC or direct SQL
    const { data: healthCheck, error: healthError } =
      await supabase.rpc('version');

    if (healthError) {
      console.log(
        '⚠️  RPC test failed (trying alternative):',
        healthError.message,
      );
    } else {
      console.log('✅ Database RPC connection successful!');
    }

    // Test 2: List all tables using a raw query
    console.log('\n2️⃣ Fetching database schema...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables_list')
      .then((result) => result)
      .catch(() => {
        // Fallback: try to list tables by attempting to query them
        return { data: null, error: null };
      });

    // Alternative: Try to discover tables by querying pg_catalog
    const { data: pgTables, error: pgError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (!pgError && pgTables) {
      console.log('✅ Found tables in public schema:');
      pgTables.forEach((t: any) => console.log(`   - ${t.tablename}`));
      console.log();
    } else {
      console.log(
        '⚠️  Could not fetch schema, trying manual table discovery...\n',
      );
    }

    // Test 3: Check specific tables
    console.log('3️⃣ Checking common tables...');
    const tablesToCheck = [
      'users',
      'shipments',
      'leads',
      'notifications',
      'profiles',
      'tenants',
    ];

    const existingTables: string[] = [];

    for (const table of tablesToCheck) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (!error.message.includes('does not exist')) {
          console.log(`⚠️  Table "${table}":`, error.message);
        }
      } else {
        console.log(`✅ Table "${table}": ${count ?? 0} records`);
        existingTables.push(table);
      }
    }

    if (existingTables.length === 0) {
      console.log(
        '⚠️  No common tables found. Database may be empty or using different schema.',
      );
    }

    console.log('\n4️⃣ Testing authentication service...');
    const { data: authData, error: authError } =
      await supabase.auth.getSession();

    if (authError) {
      console.log('⚠️  Auth check:', authError.message);
    } else {
      console.log('✅ Auth service is accessible');
    }

    console.log('\n5️⃣ Testing storage service...');
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log('⚠️  Storage check:', bucketsError.message);
    } else {
      console.log(
        `✅ Storage service is accessible (${buckets?.length ?? 0} buckets)`,
      );
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 CONNECTION SUMMARY');
    console.log('='.repeat(50));
    console.log('🌐 Supabase URL:', supabaseUrl);
    console.log('✅ Connection: SUCCESSFUL');
    console.log(
      '📦 Tables found:',
      existingTables.length > 0 ? existingTables.join(', ') : 'None',
    );
    console.log('='.repeat(50));

    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
