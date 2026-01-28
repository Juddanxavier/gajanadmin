/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/services/email-notification-service';

export const maxDuration = 60; // Allow 1 minute max (Serverless limit)

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = await createClient();
  const emailService = new EmailService(supabase);

  // 1. Fetch pending notifications (Simple locking strategy)
  // Ideally use RPC for atomic 'fetch-and-lock', but valid for single-concurrency cron
  const { data: jobs, error: fetchError } = await supabase
    .from('notification_queue')
    .select('*, shipment:shipments(*)')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No pending jobs' });
  }

  // 2. Mark as processing
  const jobIds = jobs.map((j) => j.id);
  await supabase
    .from('notification_queue')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .in('id', jobIds);

  const results = [];

  // 3. Process each job
  for (const job of jobs) {
    const shipment = job.shipment;
    if (!shipment) {
      // Data integrity issue
      await updateJobStatus(supabase, job.id, 'failed', 'Shipment not found');
      results.push({
        id: job.id,
        status: 'failed',
        reason: 'Missing shipment',
      });
      continue;
    }

    try {
      // Determine recipient (Default to customer email)
      const recipientEmail = shipment.customer_details?.email;
      const recipientName = shipment.customer_details?.name;

      if (!recipientEmail) {
        await updateJobStatus(supabase, job.id, 'failed', 'No customer email');
        results.push({ id: job.id, status: 'failed', reason: 'No email' });
        continue;
      }

      // Check tenant-specific provider via Env (simulated map for now as per plan logic)
      // Real implementation: EmailService.getTenantConfig handles the DB config selection.
      // The Env 'TENANT_PROVIDERS' requirement was to select *which* provider to use?
      // actually EmailService already loads 'tenant_notification_configs' and picks provider!
      // I just need to pass the ball to EmailService. It handles the "How".
      // The Queue just handles the "When".

      const emailResult = await emailService.sendShipmentNotification({
        shipmentId: shipment.id,
        tenantId: shipment.tenant_id,
        status:
          job.event_type === 'shipment_received'
            ? 'info_received'
            : 'delivered', // Map event to status
        recipientEmail,
        recipientName,
        trackingCode: shipment.carrier_tracking_code,
        referenceCode: shipment.white_label_code,
        invoiceAmount: shipment.invoice_details?.amount,
        invoiceCurrency: shipment.invoice_details?.currency,
        deliveryDate: shipment.estimated_delivery,
      });

      if (emailResult.success) {
        await updateJobStatus(supabase, job.id, 'completed');
        results.push({ id: job.id, status: 'completed' });
      } else {
        // Retry logic could be added here
        await updateJobStatus(supabase, job.id, 'failed', emailResult.message);
        results.push({
          id: job.id,
          status: 'failed',
          error: emailResult.message,
        });
      }
    } catch (error: any) {
      console.error(`Job ${job.id} failed:`, error);
      await updateJobStatus(supabase, job.id, 'failed', error.message);
      results.push({ id: job.id, status: 'failed', error: error.message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

async function updateJobStatus(
  client: any,
  id: string,
  status: string,
  error?: string,
) {
  await client
    .from('notification_queue')
    .update({
      status,
      updated_at: new Date().toISOString(),
      error_message: error,
    })
    .eq('id', id);
}
