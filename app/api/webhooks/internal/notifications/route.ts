/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/services/email-notification-service';
import { NotificationService } from '@/lib/services/notification-service';
import { z } from 'zod';

// Only send emails for these critical statuses
const NOTIFIABLE_STATUSES = [
  'delivered',
  'info_received',
  'exception',
] as const;

// Request validation schema
const NotificationRequestSchema = z.object({
  shipment_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  old_status: z.string(),
  new_status: z.string(),
  tracking_code: z.string(),
  reference_code: z.string(),
  customer_email: z.string().email(),
  customer_name: z.string().optional(),
  invoice_amount: z.number().optional(),
  invoice_currency: z.string().optional(),
  delivery_date: z.string().optional(),
});

type NotificationRequest = z.infer<typeof NotificationRequestSchema>;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('📧 Internal Notification Webhook Triggered');

    // 1. Security Check
    const authHeader = request.headers.get('Authorization');
    // Using NOTIFICATION_WEBHOOK_SECRET as CRON_SECRET is placeholder
    if (authHeader !== `Bearer ${process.env.NOTIFICATION_WEBHOOK_SECRET}`) {
      console.warn('⚠️ Unauthorized webhook attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // 2. Parse and validate request
    const body = await request.json();
    const validatedData = NotificationRequestSchema.parse(body);

    const { new_status, customer_email, customer_name } = validatedData;

    // Filter: Only send emails for critical statuses
    if (!NOTIFIABLE_STATUSES.includes(new_status as any)) {
      console.log(
        `⏭️  Skipping email for status: ${new_status} (not in notifiable list)`,
      );
      return NextResponse.json({
        success: true,
        message: `Status ${new_status} is not notifiable`,
        skipped: true,
      });
    }

    // Validate email
    if (!customer_email) {
      console.error('❌ No customer email provided');
      return NextResponse.json(
        { success: false, error: 'Customer email is required' },
        { status: 400 },
      );
    }

    // Get Supabase client
    const supabase = await createClient();

    // Create notification service (orchestrator)
    const notificationService = new NotificationService(supabase);

    // Send notifications
    const results = await notificationService.sendNotifications({
      shipmentId: validatedData.shipment_id,
      tenantId: validatedData.tenant_id,
      status: new_status,
      recipientEmail: customer_email,
      recipientName: customer_name,
      trackingCode: validatedData.tracking_code,
      referenceCode: validatedData.reference_code,
      invoiceAmount: validatedData.invoice_amount,
      invoiceCurrency: validatedData.invoice_currency,
      deliveryDate: validatedData.delivery_date,
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Notification webhook processed in ${duration}ms`, results);

    // Determine overall success (if at least one channel worked or all skipped)
    const emailSuccess = results.email?.success || results.email?.skipped;
    // const whatsappSuccess = results.whatsapp?.success || results.whatsapp?.skipped;

    return NextResponse.json({
      success: emailSuccess,
      results,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Notification webhook failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: (error as any).errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      },
      { status: 500 },
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'active', type: 'internal-webhook' });
}
