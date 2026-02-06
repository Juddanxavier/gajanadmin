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

async function run() {
  const tenantId = '06eb8cfb-8783-439e-a1e9-84e0fd2919d7'; // India

  // 1. Get a user
  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers();
  if (error || !users || users.length === 0) {
    console.error('No users found!', error);
    return;
  }

  const user = users[0];
  console.log(`Assigning User ${user.email} (${user.id}) to Tenant India...`);

  // 2. Insert user_tenants
  const { error: linkError } = await supabase.from('user_tenants').upsert({
    user_id: user.id,
    tenant_id: tenantId,
  });

  if (linkError) console.error('Link Error:', linkError);
  else console.log('User linked to tenant.');

  // 3. Insert user_roles
  const { error: roleError } = await supabase.from('user_roles').upsert({
    user_id: user.id,
    tenant_id: tenantId,
    role: 'admin',
  });
  if (roleError) console.error('Role Error:', roleError);
  else console.log('User gave admin role.');
}

run();
