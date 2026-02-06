/** @format */

import { NextRequest, NextResponse } from 'next/server';
import {
  notificationService,
  NotificationEventType,
} from '@/lib/services/notification-service';
import { env } from '@/lib/env'; // Assuming env is available or use process.env

export async function POST(req: NextRequest) {
  try {
    // 1. Validate Secret
    const authHeader = req.headers.get('authorization');
    const secret = process.env.NOTIFICATION_SECRET || process.env.CRON_SECRET;

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      // Allow if secret is empty? No, secure by default.
      if (secret) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      } else {
        console.warn(
          'Security Warning: NOTIFICATION_SECRET not set, allowing request.',
        );
      }
    }

    // 2. Parse Payload
    const body = await req.json();
    const {
      shipment_id,
      tenant_id,
      old_status,
      new_status,
      tracking_code,
      reference_code,
      customer_email,
      customer_name,
      invoice_amount,
      invoice_currency,
    } = body;

    if (!shipment_id || !new_status) {
      return NextResponse.json({ message: 'Invalid Payload' }, { status: 400 });
    }

    // 3. Determine Event Type
    let eventType: NotificationEventType | null = null;

    if (old_status === 'new') {
      eventType = 'shipment_created';
    } else {
      // Status Change
      switch (new_status) {
        case 'delivered':
          eventType = 'shipment_delivered';
          break;
        case 'exception':
        case 'failed':
          eventType = 'shipment_exception';
          break;
        case 'out_for_delivery':
          eventType = 'shipment_out_for_delivery';
          break;
        default:
          // Other statuses like in_transit might just be ignored by queue logic
          // if not configured, but let's map them if possible
          if (new_status === 'in_transit') eventType = 'shipment_in_transit';
          break;
      }
    }

    if (!eventType) {
      return NextResponse.json({ message: 'Event type not mapped, ignored.' });
    }

    // 4. Queue Notification
    await notificationService.queueNotification({
      shipmentId: shipment_id,
      tenantId: tenant_id,
      eventType: eventType,
      recipientEmail: customer_email,
      recipientName: customer_name || 'Customer',
      templateData: {
        tracking_number: tracking_code,
        order_number: reference_code,
        status: new_status,
        recipient_name: customer_name || 'Customer',
        // Add explicit amounts if invoice present
        ...(invoice_amount ? { invoice_amount, invoice_currency } : {}),
      },
    });

    return NextResponse.json({ success: true, message: 'Notification queued' });
  } catch (err: any) {
    console.error('Notification Webhook Error:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
