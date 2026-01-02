/**
 * Create Mock Shipment for Testing Notifications
 * 
 * Usage:
 * npm run create-mock-shipment
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  console.error('\nMake sure these are set in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMockShipment() {
  console.log('🚀 Creating mock shipment for notification testing...\n');

  try {
    // Step 1: Get a test user
    console.log('📋 Step 1: Finding a user...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .limit(1)
      .single();

    if (userError || !users) {
      console.error('❌ Error finding user:', userError);
      return;
    }

    console.log(`✅ Found user: ${users.display_name || users.email} (${users.id})`);

    // Step 2: Get or create a carrier
    console.log('\n📋 Step 2: Finding a carrier...');
    let { data: carrier, error: carrierError } = await supabase
      .from('carriers')
      .select('code, name_en')
      .limit(1)
      .single();

    if (carrierError || !carrier) {
      console.log('💡 Creating a default carrier...');
      
      const { data: newCarrier, error: createCarrierError } = await supabase
        .from('carriers')
        .insert({
          code: 'test-carrier',
          name_en: 'Test Carrier',
          name_cn: '测试承运商',
        })
        .select()
        .single();

      if (createCarrierError || !newCarrier) {
        console.error('❌ Failed to create carrier:', createCarrierError);
        return;
      }
      
      carrier = newCarrier;
      console.log(`✅ Created carrier: ${carrier?.name_en}`);
    } else {
      console.log(`✅ Found carrier: ${carrier?.name_en} (${carrier?.code})`);
    }

    // Step 3: Get a tenant
    console.log('\n📋 Step 3: Finding a tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .limit(1)
      .single();

    if (tenantError || !tenant) {
      console.error('❌ Error finding tenant:', tenantError);
      return;
    }

    console.log(`✅ Found tenant: ${tenant.name} (${tenant.slug})`);

    // Step 4: Create mock shipment
    console.log('\n📋 Step 4: Creating mock shipment...');
    const trackingNumber = `TEST${Date.now()}`;
    const whiteLabelCode = `WL${Date.now()}`;
    
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        white_label_code: whiteLabelCode,
        carrier_tracking_code: trackingNumber,
        carrier_id: carrier!.code,
        user_id: users.id,
        tenant_id: tenant.id,
        provider: 'track123',
        status: 'in_transit',
        customer_details: {
          email: users.email,
          name: users.display_name || 'Test User',
          phone: '+1234567890',
        },
      })
      .select()
      .single();

    if (shipmentError || !shipment) {
      console.error('❌ Error creating shipment:', shipmentError);
      return;
    }

    console.log(`✅ Created shipment: ${trackingNumber} (ID: ${shipment.id})`);

    // Step 5: Create tracking events
    console.log('\n📋 Step 5: Creating tracking events...');
    
    const events = [
      {
        shipment_id: shipment.id,
        status: 'info_received',
        location: 'New York, US',
        description: 'Shipment information received',
        occurred_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        shipment_id: shipment.id,
        status: 'in_transit',
        location: 'Los Angeles, US',
        description: 'Package picked up by carrier',
        occurred_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        shipment_id: shipment.id,
        status: 'in_transit',
        location: 'Mumbai, IN',
        description: 'Arrived at destination country',
        occurred_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        shipment_id: shipment.id,
        status: 'out_for_delivery',
        location: 'Delhi, IN',
        description: 'Out for delivery - THIS SHOULD TRIGGER NOTIFICATION!',
        occurred_at: new Date().toISOString(),
      },
    ];

    const { data: createdEvents, error: eventsError } = await supabase
      .from('tracking_events')
      .insert(events)
      .select();

    if (eventsError) {
      console.error('❌ Error creating events:', eventsError);
      return;
    }

    console.log(`✅ Created ${createdEvents?.length || 0} tracking events`);

    // Step 6: Update shipment status to trigger notification
    console.log('\n📋 Step 6: Updating shipment status to trigger notification...');
    
    const { error: updateError } = await supabase
      .from('shipments')
      .update({ status: 'out_for_delivery' })
      .eq('id', shipment.id);

    if (updateError) {
      console.error('❌ Error updating shipment:', updateError);
      return;
    }

    console.log('✅ Shipment status updated - This should trigger notification!');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ MOCK SHIPMENT CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`
📦 Shipment Details:
   - Tracking Number: ${trackingNumber}
   - White Label Code: ${whiteLabelCode}
   - Shipment ID: ${shipment.id}
   - Status: ${shipment.status}
   - Recipient: ${users.display_name || users.email}
   - Email: ${users.email}

📧 Notification Status:
   - A notification should be triggered for the latest event
   - Check your email: ${users.email}
   - Check notification logs in Supabase

🔍 To view this shipment:
   - Go to: /admin/shipments/${shipment.id}
   - Or search for: ${trackingNumber}
    `);

    console.log('💡 Next Steps:');
    console.log('   1. Check if email was sent to:', users.email);
    console.log('   2. View shipment in admin panel');
    console.log('   3. Check notification_logs table in Supabase');
    console.log('   4. Verify ZeptoMail dashboard for sent emails\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createMockShipment()
  .then(() => {
    console.log('✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
