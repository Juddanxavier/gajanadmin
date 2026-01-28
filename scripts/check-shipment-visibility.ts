/** @format */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugVisibility() {
  console.log('🔍 Debugging Shipment Visibility...\n');

  // 1. List all Tenants
  console.log('--- Tenants ---');
  const { data: tenants } = await supabase.from('tenants').select('id, name');
  console.table(tenants);

  // 2. Count Total
  const { count: total, error: countError } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true });
  console.log(
    `Total Rows in DB: ${total} (Error: ${countError?.message || 'none'})`,
  );

  // 3. Select columns to check for Orphans & Deletions
  const { data: shipments, error: selectError } = await supabase
    .from('shipments')
    .select('id, carrier_tracking_code, tenant_id, status, deleted_at');

  if (selectError) {
    console.error('❌ SELECT Error:', selectError);
  } else if (!shipments || shipments.length === 0) {
    console.log('⚠️ No shipments returned.');
  } else {
    console.table(shipments);

    // Check Tenant info
    const indiaTenantId = '06eb8cfb-8783-439e-a1e9-84e0fd2919d7'; // India Tenant ID
    console.log(`\n--- Users in Tenant 'India' (${indiaTenantId}) ---`);
    const { data: members } = await supabase
      .from('user_roles')
      .select(
        `
            user_id,
            role,
            profiles:user_id (email, full_name)
        `,
      )
      .eq('tenant_id', indiaTenantId);

    if (members && members.length > 0) {
      console.table(
        members.map((m) => ({
          email: (m.profiles as any)?.email,
          role: m.role,
          user_id: m.user_id,
        })),
      );
    } else {
      console.log('⚠️ No users found for this tenant.');
    }
  }
}

debugVisibility().catch(console.error);
