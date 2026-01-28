
import { createClient } from '@supabase/supabase-js';

// No dotenv, run with: npx tsx --env-file=.env.local scripts/check-connection.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables.');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '******' : 'MISSING');
  process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkConnection() {
  try {
    console.log('\n--- Checking Connection ---');
    const { data, error } = await supabase.from('user_roles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Connection Failed:', error.message);
      return;
    }
    
    console.log('Connection Successful! user_roles count:', data);
    
    console.log('\n--- Checking Users (Auth) ---');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Failed to list auth users:', authError.message);
    } else {
      console.log(`Found ${users.length} users in Auth.`);
      users.slice(0, 5).forEach(u => console.log(` - ${u.email} (${u.id})`));
    }

    console.log('\n--- Checking Tenants ---');
    const { data: tenants, error: tenantsError } = await supabase.from('tenants').select('*').limit(5);
    if (tenantsError) {
      console.error('Failed to list tenants:', tenantsError.message);
    } else {
      console.log(`Found ${tenants?.length || 0} tenants (showing max 5):`);
      tenants?.forEach(t => console.log(` - ${t.name} (${t.id})`));
    }

    console.log('\n--- Checking User Roles Table ---');
    const { data: roles, error: rolesError } = await supabase.from('user_roles').select('*').limit(5);
    if (rolesError) {
       console.error('Failed to list user roles:', rolesError.message);
    } else {
       console.log(`Found ${roles?.length || 0} user_role assignments (showing max 5):`);
       roles?.forEach(r => console.log(` - User ${r.user_id} -> Role ${r.role_id}`));
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkConnection();
