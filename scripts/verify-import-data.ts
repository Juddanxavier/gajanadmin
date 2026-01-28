/** @format */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyImport() {
  console.log('🔍 Verifying shipment data...');

  // Check for shipments with missing destination using COUNT instead of fetching all
  const { count: missingDest, error: errDest } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true })
    .is('destination_country', null)
    .eq('provider', 'manual'); // Assuming imported ones are manual

  // Check for shipments with missing origin
  const { count: missingOrigin, error: errOrigin } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true })
    .neq('origin_country', 'India')
    .eq('provider', 'manual');

  console.log(`Shipments with missing destination: ${missingDest}`);
  console.log(`Shipments with incorrect origin (!= India): ${missingOrigin}`);

  // Sample a few records
  const { data: samples } = await supabase
    .from('shipments')
    .select('carrier_tracking_code, origin_country, destination_country')
    .eq('provider', 'manual')
    .limit(5);

  console.log('\n--- Sample Records ---');
  console.table(samples);
}

verifyImport();
