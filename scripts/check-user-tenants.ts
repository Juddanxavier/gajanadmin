/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function check() {
  const tenantId = '06eb8cfb-8783-439e-a1e9-84e0fd2919d7'; // India
  console.log(`Checking user_tenants for ${tenantId}...`);

  const { data: links, error } = await supabase
    .from('user_tenants')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error) console.error(error);
  else {
    console.log(`Found ${links.length} links.`);
    console.table(links);

    if (links.length > 0) {
      // Check who these users are
      const userIds = links.map((l) => l.user_id);
      // Can't easily join auth.users, but can check user_roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*')
        .in('user_id', userIds);
      console.log('Roles for these users:', roles);
    }
  }

  // Also check if there is ANY Global Admin (super_admin) who should see everything
  const { data: superAdmins } = await supabase
    .from('user_roles')
    .select('*')
    .eq('role', 'super_admin');

  console.log('Super Admins:', superAdmins);
}

check();
