/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQueueStats() {
  console.log('Checking notification_queue table...');

  const { count, error } = await supabase
    .from('notification_queue')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log('Error checking queue (Table might not exist):', error.message);
  } else {
    console.log(`Notification Queue currently has ${count} items.`);
    if (count === 0) {
      console.log('Use of this table is verifying as inactive/empty.');
    }
  }
}

checkQueueStats().catch(console.error);
