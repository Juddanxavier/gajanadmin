/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectQueue() {
  console.log('Inspecting Notification Queue...');

  const { data: items, error } = await supabase
    .from('notification_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching queue:', error);
    return;
  }

  if (items.length === 0) {
    console.log('Queue is empty.');
  } else {
    console.table(
      items.map((i) => ({
        id: i.id,
        status: i.status,
        channel: i.channel,
        attempts: i.retry_count,
        error: i.error_message,
        created: i.created_at,
        updated: i.updated_at,
      })),
    );
  }
}

inspectQueue().catch(console.error);
