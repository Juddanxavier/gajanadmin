/** @format */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  // Check if we can select last_sign_in_at from profiles
  const { data, error } = await supabase
    .from('profiles')
    .select('last_sign_in_at')
    .limit(1);

  if (error) {
    console.error('Error selecting last_sign_in_at:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('Column definitely does not exist.');
    }
  } else {
    console.log('Column exists!');
    console.log('Sample data:', data);
  }
}

checkSchema();
