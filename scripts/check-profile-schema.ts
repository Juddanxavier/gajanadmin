/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function checkSchema() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);

  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles table sample:', data);
  }
}

checkSchema();
