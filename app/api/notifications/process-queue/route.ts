import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/services/email-notification-service';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const emailService = new EmailService(supabase);

  // 1. Get pending jobs from the queue (lock them for processing)
  const { data: jobs, error: fetchError } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(10); // Process in batches of 10

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const results = [];

  for (const job of (jobs || [])) {
    try {
      // 2. Mark as processing
      await supabase
        .from('notification_queue')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', job.id);

      // 3. Send Email
      const { payload } = job;
      const sendResult = await emailService.sendShipmentNotification({
        shipmentId: payload.shipment_id,
        tenantId: payload.tenant_id,
        status: payload.new_status,
        recipientEmail: payload.customer_email,
        recipientName: payload.customer_name || 'Customer',
        trackingCode: payload.tracking_code,
        referenceCode: payload.reference_code,
        invoiceAmount: payload.invoice_amount,
        invoiceCurrency: payload.invoice_currency,
      });

      if (sendResult.success) {
        // 4a. Success - mark as completed
        await supabase
          .from('notification_queue')
          .update({ 
            status: 'completed', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', job.id);
        
        results.push({ job_id: job.id, status: 'success' });
      } else {
        // 4b. Failed - set retry
        throw new Error(sendResult.message);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ Queue Job ${job.id} failed:`, errorMessage);

      // Max 5 retries with exponential delay
      const nextRetry = new Date();
      nextRetry.setMinutes(nextRetry.getMinutes() + Math.pow(2, job.retry_count + 1));

      await supabase
        .from('notification_queue')
        .update({ 
          status: job.retry_count >= 5 ? 'failed' : 'pending',
          retry_count: job.retry_count + 1,
          last_error: errorMessage,
          scheduled_for: nextRetry.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      results.push({ job_id: job.id, status: 'failed', error: errorMessage });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

// Security: In production, add a secret header check here so only your cron job can call this
export async function GET() {
  return NextResponse.json({ message: "Use POST to trigger queue processing" });
}
