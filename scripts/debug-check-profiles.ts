/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  console.log('Checking Profiles vs Auth Users...');

  const {
    data: { users },
    error: authError,
  } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authError) throw authError;

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, display_name', { count: 'exact' });

  if (profileError) throw profileError;

  console.log(`Total Auth Users: ${users.length}`);
  console.log(`Total Profiles: ${profiles?.length}`);

  const missingProfiles = users.filter(
    (u) => !profiles?.find((p) => p.id === u.id),
  );
  console.log(`Users missing profiles: ${missingProfiles.length}`);

  if (missingProfiles.length > 0) {
    console.log(
      'Sample missing:',
      missingProfiles.slice(0, 5).map((u) => u.email),
    );
  }
}

checkProfiles().catch(console.error);
