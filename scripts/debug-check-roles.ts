/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoles() {
  console.log('Checking User Roles...');

  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('role, count(*)', { count: 'exact' }); // Grouping not supported directly in simple select, just dumping

  const { data: allRoles } = await supabase.from('user_roles').select('*');

  console.log('All Roles:', allRoles);

  if (allRoles?.length === 0) {
    console.log(
      'WARNING: No user roles found! This explains why search returns nothing.',
    );
  }
}

checkRoles().catch(console.error);
