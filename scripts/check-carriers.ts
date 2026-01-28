/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data, error } = await supabase
    .from('carriers')
    .select('code, name_en');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(`Found ${data.length} carriers:`);
  data.forEach((c) => console.log(`- ${c.code}: ${c.name_en}`));
}

run();
