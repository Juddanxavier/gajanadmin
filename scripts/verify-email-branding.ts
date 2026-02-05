/** @format */

import { createClient } from '@supabase/supabase-js';
import { EmailService } from '../lib/services/email-notification-service';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Force Dry Run
process.env.EMAIL_DRY_RUN = 'true';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBranding() {
  console.log('🔍 Verifying Email Branding...');

  // 1. Get Tenant & Settings
  const { data: settings } = await supabase
    .from('settings')
    .select('tenant_id, company_name, currency, company_address, brand_color')
    .limit(1)
    .single();

  if (!settings) {
    console.error('❌ No settings found. Cannot test.');
    return;
  }

  console.log(
    `📋 Found Settings: Company="${settings.company_name}", Currency="${settings.currency}", Address="${settings.company_address}", Color="${settings.brand_color}"`,
  );

  // 2. Mock Shipment (Get Real One)
  const { data: shipment } = await supabase
    .from('shipments')
    .select('id, tenant_id')
    .limit(1)
    .single();
  if (!shipment) {
    console.error('No shipments found to test with.');
    return;
  }
  const shipmentId = shipment.id;
  const tenantId = shipment.tenant_id;
  console.log(`Using real Shipment ID: ${shipmentId}`);

  const service = new EmailService(supabase);

  // 3. Trigger Send (Dry Run)
  console.log('🚀 Triggering Notification (Dry Run)...');
  const result = await service.sendShipmentNotification({
    shipmentId,
    tenantId,
    status: 'pending',
    recipientEmail: 'test@example.com',
    recipientName: 'Test User',
    trackingCode: 'TEST-TRACK-123',
    referenceCode: 'REF-123',
    invoiceAmount: 100,
    // invoiceCurrency: undefined, // Should fallback to settings.currency
  });

  if (result.success && result.logId) {
    console.log('✅ Dry Run Successful.');

    // 4. Inspect Log
    const { data: log } = await supabase
      .from('notification_logs')
      .select('body, subject')
      .eq('id', result.logId)
      .single();

    if (log) {
      const hasName = log.body.includes(settings.company_name);
      const hasCurrency = log.body.includes(settings.currency);

      console.log('--- Verification ---');
      console.log(
        `Contains Company Name (${settings.company_name}): ${hasName ? '✅ YES' : '❌ NO'}`,
      );
      console.log(
        `Contains Currency (${settings.currency}): ${hasCurrency ? '✅ YES' : '❌ NO'}`,
      );

      if (!hasName || !hasCurrency) {
        console.log('Body snippet:', log.body.substring(0, 500));
      }
    }
  } else {
    console.error('❌ Send Failed:', result.message);
  }
}

verifyBranding().catch(console.error);
