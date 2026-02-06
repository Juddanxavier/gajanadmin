/** @format */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Load Environment Variables explicitly before imports
console.log('🔌 Loading environment...');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  // 2. Dynamically import services to ensure Env is loaded
  console.log('🚀 Importing Services...');
  const { emailService } = await import('../lib/services/email-service');

  // Also create a local supabase client for querying data
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      '❌ Missing credentials. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 3. User Input
  const targetEmail = process.argv[2];
  if (!targetEmail) {
    console.error(
      '❌ Usage: npx tsx scripts/test-email-notification.ts <target-email>',
    );
    process.exit(1);
  }

  // 4. Find context (Tenant + Template)
  console.log('🔍 Finding a tenant...');
  // Just take the first tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1)
    .single();

  if (!tenant) {
    console.error('❌ No tenants found.');
    process.exit(1);
  }
  console.log(`🏢 Using Tenant: ${tenant.name} (${tenant.id})`);

  // Check if template exists
  console.log('📝 Checking for email templates...');
  const templateType = 'shipment_delivered';
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('type', templateType)
    .single();

  if (!template) {
    console.warn(
      `⚠️ No template found for '${templateType}'. Sending generic email (or it might fail if EmailService enforces template)`,
    );
    // Depending on EmailService logic, it might fail.
    // But let's try.
  } else {
    console.log(`✅ Found Template: ${template.subject_template}`);
  }

  // 5. Send Email
  console.log(`📧 Sending test email to: ${targetEmail}`);

  const result = await emailService.sendTemplateEmail({
    tenantId: tenant.id,
    to: targetEmail,
    templateType: templateType,
    variables: {
      recipient_name: 'Test Tester',
      tracking_number: 'TEST-TRACK-123',
      status: 'Delivered',
      company_name: tenant.name,
      order_number: 'ORD-999',
    },
  });

  if (result.success) {
    console.log('✅ Email Sent Successfully!');
    if (result.messageId) console.log(`🆔 Message ID: ${result.messageId}`);
  } else {
    console.error('❌ Failed to send email.');
    console.error(result.error);
  }
}

main().catch((err) => {
  console.error('❌ Script Error:', err);
  process.exit(1);
});
