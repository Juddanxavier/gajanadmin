/**
 * Manual Queue Processor Script
 * Usage: npx tsx scripts/process-queue.ts
 *
 * @format
 */

import dotenv from 'dotenv';
import path from 'path';

// 1. Load Environment Variables FIRST
const result = dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
});

if (result.error) {
  console.warn('⚠️ Warning: .env.local file not found or failed to load.');
} else {
  console.log('✅ Loaded .env.local');
}

async function run() {
  console.log('Starting Notification Queue Processor...');

  try {
    // 2. Dynamic Import: Loads the service ONLY AFTER env vars are active
    const { notificationQueueService } =
      await import('../lib/services/notification-queue-service');

    const result = await notificationQueueService.processQueue();
    console.log('-----------------------------------');
    console.log(`✅ Processed: ${result.processed}`);
    console.log(`❌ Errors:    ${result.errors}`);
    console.log('-----------------------------------');
  } catch (error: any) {
    console.error('Fatal Error:', error);
    // Explicitly check for generic env missing errors
    if (error.message && error.message.includes('Invalid environment')) {
      console.error(
        '\n🔴 TIP: Check that your .env.local file has valid SUPABASE_URL and KEYS columns!',
      );
    }
  }
}

run();
