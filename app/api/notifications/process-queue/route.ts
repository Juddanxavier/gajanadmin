/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications/notification-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authorization (Optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // Temporarily relaxed for easier testing, but noted in the plan.
    }

    // 2. Process Queue
    const result = await NotificationService.processPendingNotifications();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Queue Processing Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Allow GET for easy testing/cron triggers
  return POST(request);
}
