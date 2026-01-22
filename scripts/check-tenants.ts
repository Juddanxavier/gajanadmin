/** @format */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createAdminClient } from '../lib/supabase/admin';

async function checkTenants() {
  console.log('Checking tenants...');
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('tenants').select('*');

    if (error) {
      console.error('Error fetching tenants:', error);
    } else {
      console.log(`Found ${data.length} tenants.`);
      if (data.length > 0) {
        console.log('Sample tenant:', data[0]);
        const active = data.filter((t: any) => t.is_active);
        console.log(`Active tenants: ${active.length}`);
      } else {
        console.log('No tenants found in the table.');
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTenants();
