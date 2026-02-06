/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { notificationQueueService } from '@/lib/services/notification-queue-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run the Processor
    const result = await notificationQueueService.processQueue(50); // Process up to 50 items

    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors,
    });
  } catch (error: any) {
    logger.error('Cron job failed', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
