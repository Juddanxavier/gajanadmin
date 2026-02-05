/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260202_link_shipments_on_markup.sql',
);
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

async function applyMigration() {
  console.log('Applying Migration via exec_sql RPC...');

  // Try to clean/split if needed, but simple trigger creation often works in one block if simple.
  // Although $$ delimiters might need care if stripping comments?
  // fs.readFileSync returns raw string.

  const { error } = await supabase.rpc('exec_sql', { sql: migrationSql });

  if (error) {
    console.error('Failed to apply migration via RPC:', error);
    console.log(
      'You may need to run this SQL manually in Supabase Dashboard SQL Editor.',
    );
  } else {
    console.log('Successfully applied migration!');
  }
}

applyMigration().catch(console.error);
