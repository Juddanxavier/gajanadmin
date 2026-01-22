/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Override process.env for good measure, though we will use values directly
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = envConfig['NEXT_PUBLIC_SUPABASE_URL'];
const serviceKey = envConfig['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceKey) {
  console.error('Missing credentials in .env.local');
  console.log('URL:', supabaseUrl);
  console.log('Key exists:', !!serviceKey);
  process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  try {
    console.log('Fetching tenants...');
    const { data, error, count } = await supabase
      .from('tenants')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Error:', error);
    } else {
      console.log(`Success! Found ${count} tenants.`);
      console.log('Tenants:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
