/** @format */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !serviceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

console.log('Testing connection to:', supabaseUrl);

async function test() {
  // 1. Test Anon Client
  console.log('\n--- Testing Anon Client ---');
  const client = createClient(supabaseUrl!, supabaseKey!);

  // Try to read a public table or just check session?
  // Checking health or simple RPC if available, or just auth.
  const { data, error } = await client
    .from('tenants')
    .select('count', { count: 'exact', head: true });

  if (error) {
    console.error('Anon Client Error:', error.message);
    if (error.message.includes('Invalid API key')) {
      console.error('=> YOUR ANON KEY IS INVALID or does not match the URL.');
    }
  } else {
    console.log('Anon Client Connection OK. (Tenants table check passed)');
  }

  // 2. Test Admin Client
  console.log('\n--- Testing Admin Client ---');
  const admin = createClient(supabaseUrl!, serviceKey!);
  const { data: users, error: adminError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });

  if (adminError) {
    console.error('Admin Client Error:', adminError.message);
    if (
      adminError.message.includes('Invalid API key') ||
      adminError.message.includes('Invalid authentication credentials')
    ) {
      console.error('=> YOUR SERVICE ROLE KEY IS INVALID.');
    }
  } else {
    console.log('Admin Client Connection OK. Users found:', users.users.length);
  }
}

test().catch((e) => console.error(e));
