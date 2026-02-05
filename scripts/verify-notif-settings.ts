/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyNotificationConfig() {
  console.log('Verifying settings for triggers...');

  const { data: settings, error } = await supabase
    .from('settings')
    .select('tenant_id, notification_triggers');

  if (error) {
    console.error('Error fetching settings:', error);
  } else {
    console.log('Settings Found:', settings);
    if (settings?.length > 0) {
      console.log(
        'Triggers configured for first tenant:',
        settings[0].notification_triggers,
      );
    } else {
      console.log('No settings records found.');
    }
  }
}

verifyNotificationConfig().catch(console.error);
