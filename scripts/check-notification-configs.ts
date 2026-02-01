/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function checkNotificationConfigs() {
  const { data, error } = await supabase
    .from('tenant_notification_configs')
    .select('*');

  if (error) {
    console.error('Error fetching configs:', error.message);
  } else {
    console.log('Notification Configs:', data);
  }
}

checkNotificationConfigs();
