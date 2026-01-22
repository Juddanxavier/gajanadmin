/** @format */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey);

async function listUsers() {
  const {
    data: { users },
    error,
  } = await admin.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  console.log('--- Registered Users ---');
  users.forEach((u) => {
    console.log(
      `ID: ${u.id} | Email: ${u.email} | Confirmed: ${u.email_confirmed_at ? 'Yes' : 'No'} | Role: ${u.role}`,
    );
  });

  // Also check their roles in 'user_roles' table
  console.log('\n--- User Roles ---');
  const { data: roles } = await admin.from('user_roles').select('*');
  console.log(roles);
}

listUsers();
