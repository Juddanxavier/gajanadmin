/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { syncCarriers } from '@/app/(dashboard)/shipments/carrier-actions';

// Standard 60s timeout for cron jobs
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Security: Check for CRON_SECRET if configured, or specific header
  const authHeader = request.headers.get('authorization');

  // Basic protection: In production, ensure this is called by a trusted source
  // For Vercel Cron, checking 'Authorization: Bearer <CRON_SECRET>' is best practice
  // For Supabase pg_cron, we can hardcode a secret token in the SQL header

  const CRON_SECRET = process.env.CRON_SECRET || 'gajan_cron_secret_123';

  if (
    authHeader !== `Bearer ${CRON_SECRET}` &&
    request.nextUrl.searchParams.get('key') !== CRON_SECRET
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncCarriers();
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, count: result.data?.count });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
