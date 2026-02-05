/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettingsSchema() {
  console.log('Checking Settings Table Columns...');

  // Try to select custom_fields to see if it fails
  const { data, error } = await supabase
    .from('settings')
    .select('id, custom_fields')
    .limit(1);

  if (error) {
    console.error('Error selecting custom_fields:', error.message);
    // List all columns if possible? Not easy via client, but error message confirms missing column.
  } else {
    console.log('Successfully selected custom_fields. Column exists.');
  }
}

checkSettingsSchema().catch(console.error);
