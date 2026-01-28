/** @format */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log('🔍 Testing App Query...');

  // This is the query used in the application
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id,
      email,
      user_roles (
        role
      )
    `,
    )
    .limit(5);

  if (error) {
    console.error('❌ Query ERROR:', error.message);
    console.error('   Code:', error.code);
    console.error('   Hint:', error.hint);
  } else {
    console.log(`✅ Query SUCCESS. Rows returned: ${data.length}`);
    if (data.length > 0) {
      console.log('   Sample:', JSON.stringify(data[0], null, 2));
    }
  }
}

testQuery();
