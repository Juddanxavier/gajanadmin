/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1)
    .single();
  console.log(`Checking Settings for Tenant: ${tenant.name}`);

  const { data: settings } = await supabase
    .from('settings')
    .select('notification_triggers, email_notifications_enabled')
    .eq('tenant_id', tenant.id)
    .single();

  console.log('Settings:', settings);
}

checkTriggers().catch(console.error);
