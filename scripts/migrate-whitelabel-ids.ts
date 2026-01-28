/** @format */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log('Starting White Label ID migration...');

  // Fetch all shipments
  const { data: shipments, error } = await supabase
    .from('shipments')
    .select('id, white_label_code')
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching shipments:', error);
    process.exit(1);
  }

  console.log(`Found ${shipments.length} shipments to migrate.`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const shipment of shipments) {
    // Check if simple format check (starts with GTEI or GTES)
    if (
      shipment.white_label_code?.startsWith('GTEI') ||
      shipment.white_label_code?.startsWith('GTES')
    ) {
      skippedCount++;
      continue;
    }

    // Generate new ID (Default to GTEI as requested for existing records)
    const randomDigits = Math.floor(
      10000000 + Math.random() * 90000000,
    ).toString();
    const newCode = `GTEI${randomDigits}`;

    const { error: updateError } = await supabase
      .from('shipments')
      .update({ white_label_code: newCode })
      .eq('id', shipment.id);

    if (updateError) {
      console.error(`Failed to update shipment ${shipment.id}:`, updateError);
      errorCount++;
    } else {
      updatedCount++;
      // console.log(`Updated ${shipment.id}: ${shipment.white_label_code} -> ${newCode}`);
    }
  }

  console.log('Migration complete!');
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped (already migrated): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
}

migrate();
