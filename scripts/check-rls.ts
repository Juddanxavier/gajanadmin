/** @format */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  console.log('🔍 Checking RLS Policies...\n');

  const { data: policies, error } = await supabase
    .from('pg_policies')
    .select('tablename, policyname, cmd, roles')
    .in('tablename', ['profiles', 'user_roles', 'user_tenants'])
    .order('tablename');

  if (error) {
    // If we can't query pg_policies directly via SDK (requires permissions),
    // we'll try to infer from common issues or just print 'Access Denied'.
    console.error('❌ Could not query system tables directly:', error.message);
    return;
  }

  if (policies && policies.length > 0) {
    policies.forEach((p) => {
      console.log(
        `🛡️ Table: ${p.tablename} | Policy: ${p.policyname} | Action: ${p.cmd}`,
      );
    });
  } else {
    console.log(
      '⚠️ No policies found? (Or checking system tables not allowed via API)',
    );
  }
}

checkPolicies();
