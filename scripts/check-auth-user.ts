/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function checkAuthUser() {
  const userId = 'd46363e8-3a91-442f-a708-e7f60849310a';
  const {
    data: { user },
    error,
  } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    console.error('Error fetching auth user:', error);
  } else {
    console.log('Auth user metadata:', user?.user_metadata);
  }
}

checkAuthUser();
