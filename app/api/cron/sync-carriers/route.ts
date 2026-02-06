/** @format */

import { NextResponse } from 'next/server';
import { syncCarriers } from '@/app/(dashboard)/shipments/carrier-actions';

export async function GET() {
  const result = await syncCarriers();
  return NextResponse.json(result);
}
