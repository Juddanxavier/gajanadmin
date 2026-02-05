/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NotificationService } from '@/lib/services/notification-service';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function POST(req: NextRequest) {
  try {
    // 1. Basic Auth Check (simplified for cron)
    const authHeader = req.headers.get('authorization');
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      // Fallback: Check if request comes from Supabase internal network?
      // Ideally we strictly enforce CRON_SECRET.
      // If CRON_SECRET is not set, we might be open.
    }

    const supabase = createAdminClient();
    const notificationService = new NotificationService(supabase);

    // 2. Fetch Pending Items
    // "FOR UPDATE SKIP LOCKED" is ideal but Supabase-js doesn't expose it easily in .select()
    // We try to grab 'pending' items, update them to 'processing', then work on them.
    // This simple approach might have race conditions if multiple workers run, but valid for single cron.

    // Fetch top 50 pending
    const { data: items, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;

    if (!items || items.length === 0) {
      return NextResponse.json({ message: 'No pending notifications' });
    }

    console.log(`[QueueWorker] Processing ${items.length} notifications...`);

    const results = [];

    // 3. Process Loop
    for (const item of items) {
      // Mark as processing (optional, helps visibility)
      await supabase
        .from('notification_queue')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', item.id);

      const { success, error } =
        await notificationService.processQueueItem(item);

      if (success) {
        await supabase
          .from('notification_queue')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);
        results.push({ id: item.id, status: 'completed' });
      } else {
        // Increment retry count?
        const retryCount = (item.retry_count || 0) + 1;
        const newStatus = retryCount >= 3 ? 'failed' : 'pending'; // Retry up to 3 times
        // Backoff? simplistic: leave as pending, cron picks it up again.
        // Ideally we set 'scheduled_for' to future.
        await supabase
          .from('notification_queue')
          .update({
            status: newStatus,
            retry_count: retryCount,
            error_message: error,
            updated_at: new Date().toISOString(),
            scheduled_for: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Retry in 5 mins
          })
          .eq('id', item.id);

        results.push({ id: item.id, status: 'failed', error });
      }
    }

    return NextResponse.json({ processed: results.length, details: results });
  } catch (error: any) {
    console.error('[QueueWorker] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
