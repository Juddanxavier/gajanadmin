/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/services/notification-service';
import { logger } from '@/lib/logger';

/**
 * Cron job endpoint to process pending notifications
 * Triggered by Supabase cron job or external scheduler
 *
 * Setup in Supabase:
 * SELECT cron.schedule(
 *   'process-notifications',
 *   '* * * * *',  -- Every minute
 *   $$ SELECT net.http_post(
 *     url:='https://your-domain.com/api/cron/process-notifications',
 *     headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
 *   ) AS request_id; $$
 * );
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      logger.warn('Unauthorized cron request', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Processing notification queue via cron');

    // Process notifications
    const result = await notificationService.processPendingNotifications();

    logger.info('Cron job completed', result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Cron job failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// Allow GET for health checks
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'notification-processor',
  });
}
