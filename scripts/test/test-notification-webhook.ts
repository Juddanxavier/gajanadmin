/** @format */

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testWebhook() {
  const secret = process.env.NOTIFICATION_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      '❌ NOTIFICATION_WEBHOOK_SECRET not set, cannot authenticate.',
    );
    return;
  }

  const url = 'http://localhost:3000/api/webhooks/internal/notifications';

  const payload = {
    shipment_id: '00000000-0000-0000-0000-000000000000', // Mock UUID for structure
    tenant_id: '00000000-0000-0000-0000-000000000000', // Mock UUID
    old_status: 'pending',
    new_status: 'delivered', // Critical status
    tracking_code: 'TEST-TRACK-123',
    reference_code: 'REF-123',
    customer_email: 'test@example.com',
    customer_name: 'Test Verification User',
    delivery_date: new Date().toISOString(),
  };

  console.log(`🚀 Sending Webhook Request to ${url}...`);
  console.log(`🔑 Using Secret: ${secret.substring(0, 5)}...`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (res.ok) {
      console.log(
        '✅ Webhook Test Passed! (Note: It might say successful even if email failed internally due to mocks, check "results")',
      );
    } else {
      console.log('❌ Webhook Test Failed');
    }
  } catch (error) {
    console.error('❌ Connection Error:', error);
    console.log('Make sure the dev server is running on localhost:3000');
  }
}

testWebhook();
