/** @format */

import * as dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (!process.env.TRACK123_API_SECRET) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

import { Track123Service } from '../lib/services/track123-service';

async function main() {
  const secret = process.env.TRACK123_API_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !supabaseUrl || !supabaseKey) {
    console.error(
      'Missing env vars: TRACK123_API_SECRET, NEXT_PUBLIC_SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY',
    );
    process.exit(1);
  }

  const service = new Track123Service({ apiKey: secret });
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Fetching carriers from Track123...');
  try {
    const carriers = await service.listCouriers();
    console.log(`Fetched ${carriers.length} carriers.`);

    if (carriers.length === 0) {
      console.warn('No carriers found to sync.');
      return;
    }

    console.log('Upserting to Supabase...');
    const upsertData = carriers.map((c) => ({
      code: c.courier_code,
      name_en: c.courier_name,
      type: c.courier_type || 'unknown',
      updated_at: new Date().toISOString(),
    }));

    // Batch insert to avoid huge payload if thousands
    const BATCH_SIZE = 500;
    for (let i = 0; i < upsertData.length; i += BATCH_SIZE) {
      const chunk = upsertData.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('carriers').upsert(chunk, {
        onConflict: 'code',
        ignoreDuplicates: false,
      });

      if (error) {
        console.error(`Error syncing batch ${i}:`, error.message);
      } else {
        console.log(`Synced batch ${i} - ${i + chunk.length}`);
      }
    }

    console.log('Done!');
  } catch (e: any) {
    console.error('Script failed:', e.message);
  }
}

main();
