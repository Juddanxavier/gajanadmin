/** @format */

import { z } from 'zod';

const envSchema = z.object({
  // Public variables (available on client and server)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),

  // Server-only variables (undefined on client)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1).optional(), // Optional for now if not strictly enforced everywhere yet

  // Environment
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

// Safe parsing to avoid crashing build if imported on client by mistake,
// though strict runtime checks should happen on server.
// We'll throw if on server and missing keys.

const processEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  NODE_ENV: process.env.NODE_ENV,
};

// Only validate if we are NOT in the browser (basic check)
// or if we want to enforcing it.
// In Next.js, 'window' is undefined on server.
const isServer = typeof window === 'undefined';

let env = processEnv as z.infer<typeof envSchema>;

if (isServer && !process.env.SKIP_ENV_VALIDATION) {
  const parsed = envSchema.safeParse(processEnv);
  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:',
      parsed.error.flatten().fieldErrors,
    );
    throw new Error('Invalid environment variables');
  }
  env = parsed.data;
}

export { env };
