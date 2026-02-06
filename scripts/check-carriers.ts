/** @format */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCarriers() {
  console.log('Checking carriers table...');
  const { count, error: countError } = await supabase
    .from('carriers')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error getting count:', countError);
    return;
  }
  console.log(`Total carriers: ${count}`);

  const { data, error } = await supabase
    .from('carriers')
    .select('code, name_en')
    .limit(10);

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  console.log('First 10 carriers:', data);

  // Check for common ones
  const { data: common } = await supabase
    .from('carriers')
    .select('code, name_en')
    .in('code', ['ups', 'fedex', 'usps', 'dhl', 'fedex-express', 'fedex-uk']);

  console.log('Common carriers entries:', common);
}

checkCarriers().catch(console.error);
