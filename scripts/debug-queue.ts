/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQueue() {
  console.log('Checking Notification Queue...');
  const { data: queue, error } = await supabase
    .from('notification_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching queue:', error);
  } else {
    console.log('Recent Queue Items:', JSON.stringify(queue, null, 2));
  }

  console.log('Checking Notification Providers...');
  const { data: providers } = await supabase
    .from('notification_providers')
    .select('*');
  console.log('Providers:', providers);

  console.log('Checking Tenant Notification Configs...');
  const { data: configs } = await supabase
    .from('tenant_notification_configs')
    .select('*');
  console.log('Configs:', configs);
}

checkQueue();
