/**
 * Check Queue Status Script
 * Usage: npx tsx scripts/check-queue-status.ts
 *
 * @format
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load Env
const result = dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase Credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching last 5 notification queue items...');

  const { data, error } = await supabase
    .from('notification_queue')
    .select('id, event_type, status, execution_log, created_at, scheduled_for')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching queue:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No items found in queue.');
    return;
  }

  console.table(
    data.map((item) => ({
      Type: item.event_type,
      Status: item.status,
      Log: JSON.stringify(item.execution_log),
      Created: new Date(item.created_at).toLocaleTimeString(),
    })),
  );
}

run();
