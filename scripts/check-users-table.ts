/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function checkUsersTable() {
  const { data, error } = await supabase.from('users').select('*').limit(1);

  if (error) {
    console.log('Error fetching users (might not exist):', error.message);
  } else {
    console.log('Users table sample:', data);
  }
}

checkUsersTable();
