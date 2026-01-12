/** @format */

/**
 * Environment Configuration
 * Centralized environment variable access with type safety
 */

// Check if we're in production
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isTest = process.env.NODE_ENV === 'test';

// Supabase Configuration
export const supabase = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// App Configuration
export const app = {
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Gajan Admin',
};

// Email Configuration
export const email = {
  from: process.env.EMAIL_FROM || 'noreply@gajan.local',
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },
};

// Tracking APIs
export const tracking = {
  track123ApiKey: process.env.TRACK123_API_KEY,
  aftershipApiKey: process.env.AFTERSHIP_API_KEY,
};

// Feature Flags
export const features = {
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableMockData: process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true',
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  disableAnimations: process.env.NEXT_PUBLIC_DISABLE_ANIMATIONS === 'true',
  enableProfiling: process.env.NEXT_PUBLIC_ENABLE_PROFILING === 'true',
  enableRateLimiting: process.env.NEXT_PUBLIC_ENABLE_RATE_LIMITING === 'true',
  maxRequestsPerMinute: parseInt(
    process.env.NEXT_PUBLIC_MAX_REQUESTS_PER_MINUTE || '60'
  ),
};

// Monitoring
export const monitoring = {
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  gaId: process.env.NEXT_PUBLIC_GA_ID,
};

// Validation - throw error if critical env vars are missing
if (!supabase.url || !supabase.anonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Log environment on startup (only in development)
if (isDevelopment) {
  console.log('🔧 Environment:', process.env.NODE_ENV);
  console.log('🌐 App URL:', app.url);
  console.log(
    '📊 Mock Data:',
    features.enableMockData ? 'Enabled' : 'Disabled'
  );
  console.log(
    '🎨 Animations:',
    features.disableAnimations ? 'Disabled' : 'Enabled'
  );
}

// Export all as default
export default {
  isProduction,
  isDevelopment,
  isTest,
  supabase,
  app,
  email,
  tracking,
  features,
  monitoring,
};
