/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQueueTrigger() {
  console.log('Checking for active triggers on shipments table...');

  // Introspection query to list triggers
  const { data, error } = await supabase
    .rpc('exec_sql_read', {
      sql: "SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table = 'shipments';",
    })
    // Fallback if rpc missing
    .catch((err) => ({ data: null, error: err }));

  if (!data && !error) {
    // Try querying pg_trigger via raw sql? No simple way without RPC.
    console.log(
      'Cannot inspect triggers directly without RPC. Suggest assuming it might exist if migration 20260125 was run.',
    );
  } else if (error) {
    console.log('Error checking triggers:', error);
  } else {
    console.log('Triggers found:', data);
  }
}

checkQueueTrigger().catch(console.error);
