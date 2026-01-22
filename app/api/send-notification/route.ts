/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/services/email-notification-service';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Email notification triggered (Legacy Endpoint)');

    const payload = await request.json();
    const {
      shipment_id,
      tenant_id,
      new_status,
      carrier_tracking_code,
      white_label_code,
      customer_details,
      invoice_details,
    } = payload;

    const supabase = await createClient();
    const emailService = new EmailService(supabase);

    // Delegate to the unified service
    const result = await emailService.sendShipmentNotification({
      shipmentId: shipment_id,
      tenantId: tenant_id,
      status: new_status,
      recipientEmail: customer_details?.email,
      recipientName: customer_details?.name || 'Customer',
      trackingCode: carrier_tracking_code,
      referenceCode: white_label_code,
      invoiceAmount: invoice_details?.amount,
      invoiceCurrency: invoice_details?.currency,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent',
        ...result,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
