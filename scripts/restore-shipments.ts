/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function restoreShipments() {
  console.log('🩹 Restoring all shipments (setting deleted_at = NULL)...');

  const { data, error } = await supabase
    .from('shipments')
    .update({ deleted_at: null })
    .neq('status', 'ignore_me') // simple filter to affect all rows usually
    .select();

  if (error) {
    console.error('❌ Restore failed:', error);
  } else {
    console.log(`✅ Restored/Updated ${data?.length} shipments.`);
    console.log(
      '   These should definitely be visible now if tenant context is correct.',
    );
  }
}

restoreShipments();
