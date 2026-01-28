/** @format */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);

async function fixCountryCodes() {
  console.log('🌍 Normalizing country codes...');

  // 1. Fetch distinct destination countries
  const { data: dbCountries, error } = await supabase
    .from('shipments')
    .select('destination_country')
    .neq('destination_country', null);

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  // Get unique list
  const uniqueCountries = [
    ...new Set(dbCountries.map((c) => c.destination_country)),
  ];
  console.log('Found countries:', uniqueCountries);

  let updatedCount = 0;

  for (const name of uniqueCountries) {
    // Skip if already 2 chars, UNLESS it's 'UK' (which needs to be 'GB')
    if (!name || (name.length === 2 && name.toUpperCase() !== 'UK')) continue;

    // Try to get code from name (handles many variations)
    // alpha2 is the 2-letter ISO code we want
    let code = countries.getAlpha2Code(name, 'en');

    // Fallback for some common edge cases if needed (library handles most)
    if (!code) {
      // simple manual overrides for things the library might miss or strictly specific to client data
      if (name.toUpperCase() === 'DUBAI') code = 'AE';
      if (name.toUpperCase() === 'PHILIPINES') code = 'PH'; // misspellings
      if (name.toUpperCase() === 'NETHER') code = 'NL';
      if (name.toUpperCase() === 'NEWZEALAND') code = 'NZ';
      if (name.toUpperCase() === 'UK') code = 'GB';
    }

    if (code) {
      console.log(`Updating '${name}' -> '${code}'...`);
      const { error: updateError } = await supabase
        .from('shipments')
        .update({ destination_country: code })
        .eq('destination_country', name);

      if (updateError) {
        console.error(`Error updating ${name}:`, updateError.message);
      } else {
        updatedCount++;
      }
    } else {
      console.warn(`⚠️ No mapping found for: '${name}'`);
    }
  }

  // Also fix Origin = 'India' -> 'IN'
  await supabase
    .from('shipments')
    .update({ origin_country: 'IN' })
    .eq('origin_country', 'India');

  console.log(`✅ Normalized ${updatedCount} country groups.`);
  console.log(`(You may need to refresh the dashboard to see flags)`);
}

fixCountryCodes();
