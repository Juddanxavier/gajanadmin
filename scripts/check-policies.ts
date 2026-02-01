/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function checkPolicies() {
  const { data, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'profiles');

  if (error) {
    // pg_policies is a system view, might not be accessible via API easily depending on permissions,
    // but try rpc or raw query if possible.
    // Actually, simple client often can't access pg_policies.
    console.log('Error fetching policies:', error.message);
  } else {
    console.log('Policies:', data);
  }
}

// Alternative: Try to select as a random user (should fail) vs specific user?
// Hard to test RLS without auth token.

// I will just inspection the migration status or assume I need to APPLY the migration again?
// The user has the migration file OPEN.
checkPolicies();
