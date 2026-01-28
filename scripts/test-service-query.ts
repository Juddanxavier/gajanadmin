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

async function testQuery() {
  console.log('🧪 Testing Service Query Logic...');

  // Replicate ShipmentService.getShipments query
  let query = supabase
    .from('shipments')
    .select('*, carrier:carriers(name_en, name_cn)', { count: 'exact' });

  // Exclude soft-deleted
  query = query.is('deleted_at', null);

  // No tenant filter (simulate admin with no context)

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ Query Failed:', error);
  } else {
    console.log(`✅ Query returned ${data?.length} rows (Count: ${count}).`);
    if (data && data.length > 0) {
      console.log('Sample Row:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️ Returned empty array.');
    }
  }
}

testQuery();
