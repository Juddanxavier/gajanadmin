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
  'supabase/migrations/20260203_remove_legacy_triggers.sql',
);
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

async function applyMigration() {
  console.log('Applying Migration to remove legacy triggers...');

  const { error } = await supabase.rpc('exec_sql', { sql: migrationSql });

  if (error) {
    console.error('Failed to apply migration via RPC:', error);
    console.log('Please execute the SQL manually if RPC is not available.');
  } else {
    console.log('Successfully dropped legacy triggers and functions!');
  }
}

applyMigration().catch(console.error);
