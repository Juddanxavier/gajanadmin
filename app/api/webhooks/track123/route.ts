/** @format */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { Track123WebhookPayload } from '@/lib/types/track123';
import { env } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, verify } = body as Track123WebhookPayload;

    // 1. Verify Signature
    if (!verify || !verify.signature || !verify.timestamp) {
      return NextResponse.json(
        { message: 'Missing verification data' },
        { status: 401 },
      );
    }

    // Using existing env var or adding a new one for TRACK123_API_KEY
    const apiKey = process.env.TRACK123_API_KEY;

    if (!apiKey) {
      console.error('TRACK123_API_KEY is not defined');
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 },
      );
    }

    // HMAC-SHA256 Verification
    const hmac = crypto.createHmac('sha256', apiKey);
    hmac.update(verify.timestamp);
    const expectedSignature = hmac.digest('hex');

    // Simple comparison
    if (expectedSignature !== verify.signature) {
      console.error('Invalid signature');
      return NextResponse.json(
        { message: 'Invalid signature' },
        { status: 401 },
      );
    }

    // 2. Initialize Admin Client
    const supabase = createAdminClient();

    // 3. Find Shipment
    // We map local shipments by carrier_tracking_code
    const { data: shipment, error: findError } = await supabase
      .from('shipments')
      .select('id, tenant_id')
      .eq('carrier_tracking_code', data.trackNo)
      .single();

    if (findError || !shipment) {
      console.warn(`Shipment not found for tracking number: ${data.trackNo}`);
      // Return 200 to acknowledge receipt and stop retries
      return NextResponse.json(
        { message: 'Shipment not found' },
        { status: 200 },
      );
    }

    // 4. Update Shipment Status
    const updateData: any = {
      status:
        data.transitStatus?.toLowerCase() === 'delivered'
          ? 'delivered'
          : data.transitStatus?.toLowerCase() === 'exception'
            ? 'exception'
            : 'in_transit', // Default to in_transit for updates, or maybe map 'pending' explicitly if needed.
      // Better: just keep it simple or use a mapping function.
      // For now, let's just make sure it's lowercase.
      substatus: data.transitSubStatus,
      last_synced_at: new Date().toISOString(),
      raw_response: data, // Store full payload for debugging
    };

    // Update specific fields based on status
    if (data.transitStatus === 'DELIVERED') {
      updateData.actual_delivery_date =
        data.deliveredTime || new Date().toISOString();
    }

    // Extract latest location if available
    if (
      data.localLogisticsInfo?.trackingDetails &&
      data.localLogisticsInfo.trackingDetails.length > 0
    ) {
      const latestEvent = data.localLogisticsInfo.trackingDetails[0];
      updateData.latest_location = latestEvent.address;
    }

    const { error: updateError } = await supabase
      .from('shipments')
      .update(updateData)
      .eq('id', shipment.id);

    if (updateError) {
      console.error('Failed to update shipment:', updateError);
      return NextResponse.json(
        { message: 'Database update failed' },
        { status: 500 },
      );
    }

    // 5. Insert Tracking Event
    if (
      data.localLogisticsInfo?.trackingDetails &&
      data.localLogisticsInfo.trackingDetails.length > 0
    ) {
      const latestEvent = data.localLogisticsInfo.trackingDetails[0];

      // Simple check to avoid duplicates: INSERT ON CONFLICT or Check existence
      // For simplicity, we just try to insert the latest distinct event
      await supabase.from('tracking_events').upsert(
        {
          shipment_id: shipment.id,
          status: latestEvent.transitSubStatus || 'unknown',
          location: latestEvent.address,
          description: latestEvent.eventDetail,
          occurred_at: latestEvent.eventTime, // Ensure format matches ISO string
          raw_data: latestEvent,
        },
        { onConflict: 'shipment_id, occurred_at, status' },
      );
    }

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
