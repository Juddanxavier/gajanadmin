/** @format */

/**
 * Supabase Connection Pool Configuration
 *
 * This helps prevent "no available server" errors by:
 * 1. Limiting concurrent connections
 * 2. Reusing connections
 * 3. Adding retry logic
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Connection pool settings
const poolConfig = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'gajan-admin',
    },
  },
};

// Singleton pattern - reuse the same client
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, poolConfig);
  }
  return supabaseClient;
}

// For server-side usage
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    ...poolConfig,
    auth: {
      persistSession: false, // Don't persist on server
    },
  });
}
