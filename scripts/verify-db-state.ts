/** @format */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  const { data: gbShipments, error } = await supabase
    .from('shipments')
    .select('id, destination_country, carrier_tracking_code')
    .eq('destination_country', 'GB')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Shipments with GB:', gbShipments.length);
  if (gbShipments.length > 0) {
    console.log('Sample:', gbShipments[0]);
  }

  const { data: ukShipments } = await supabase
    .from('shipments')
    .select('count')
    .eq('destination_country', 'UK');

  console.log('Shipments with UK (should be 0):', ukShipments?.length || 0); // Note: .select('count') usage is wrong for checks but simple select works

  const { count: ukCount } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true })
    .eq('destination_country', 'UK');

  console.log('Actual UK count:', ukCount);
}

verify();
