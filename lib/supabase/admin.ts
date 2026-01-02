import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Create a Supabase admin client with service role key
 * This client has elevated privileges and should ONLY be used in server-side code
 * NEVER expose this client to the browser
 */
import { env } from '@/lib/env';

/**
 * Create a Supabase admin client with service role key
 * This client has elevated privileges and should ONLY be used in server-side code
 * NEVER expose this client to the browser
 */
export function createAdminClient() {
  // env is already validated at runtime 
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (process.env.NODE_ENV === 'development') {
      // Debug log if really needed, but env.ts helps ensure they exist
      // console.log('[createAdminClient] Verified env vars');
  }

  // Double check removed because env.ts guarantees presence or throws


  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
