
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// --- Load Env ---
const envPath = path.resolve(process.cwd(), '.env.local');
// console.log('Loading env from:', envPath); // optional verify
const env: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim();
    });
} else {
    // try .env fallback
    const envPath2 = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath2)) {
         const envConfig = fs.readFileSync(envPath2, 'utf8');
         envConfig.split('\n').forEach(line => {
            const [key, val] = line.split('=');
            if (key && val) env[key.trim()] = val.trim();
        });
    }
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env/.env.local');
    process.exit(1);
}


const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedMockShipment() {
  console.log('🌱 Seeding mock shipment for notification testing...');

  // 1. Get or Create a Test User/Tenant
  // We'll use the first tenant found or create one
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('❌ No tenant found. Please create a tenant first.');
    return;
  }

  // 2. Create a Mock Shipment
  // Using a tracking number that looks like a test: TEST-NOTIF-{Random}
  const trackingCode = `TEST-NOTIF-${Math.floor(Math.random() * 10000)}`;
  const customerEmail = 'test@example.com'; // Change this to your real email to test
  
  const shipment = {
    white_label_code: `WL-${trackingCode}`, // Required field
    carrier_tracking_code: trackingCode, // Main tracking number
    carrier_id: 'dhl', // Mock carrier
    status: 'pending', // Start as pending
    tenant_id: tenantId,
    customer_details: {
      name: 'Test Customer',
      email: customerEmail,
      phone: '+1234567890'
    },
    provider: 'track123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('shipments')
    .insert(shipment)
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating shipment:', error.message);
    return;
  }

  console.log(`✅ Shipment created successfully!`);
  console.log(`🆔 ID: ${data.id}`);
  console.log(`📦 Tracking Code: ${data.carrier_tracking_code}`);
  console.log(`👤 Customer Email: ${customerEmail}`);
  console.log(`\nTo test notification trigger:`);
  console.log(`1. Ensure you have configured SMTP/SMS settings for Tenant: ${tenantId}`);
  console.log(`2. Update this shipment's status to 'in_transit' or 'delivered' using the UI or DB.`);
  console.log(`   (Since this is a mock 'track123' shipment, manual sync won't automatically update it unless you have a real tracking code. best to mutually update db or use a real code)`);
  
  // Optional: We can simulate a "Sync" that changes status immediately?
  // No, better to let user do it to see the flow.
}

seedMockShipment();
