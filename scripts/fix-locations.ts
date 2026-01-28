/** @format */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLocations() {
  console.log('🛠️ Fixing latest_location...');

  // Fetch records to update
  const { data: shipments, error } = await supabase
    .from('shipments')
    .select('id, destination_country')
    .eq('latest_location', 'Historical Data Entry');

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Found ${shipments.length} records to update.`);

  let updated = 0;
  for (const s of shipments) {
    if (!s.destination_country) continue;

    await supabase
      .from('shipments')
      .update({ latest_location: s.destination_country })
      .eq('id', s.id);
    updated++;
  }

  console.log(`✅ Updated ${updated} records.`);
  console.log(`(Records without destination_country were skipped)`);
}

fixLocations();
