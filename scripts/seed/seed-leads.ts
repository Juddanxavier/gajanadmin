/** @format */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { generateMockLeads } from '../lib/utils/mock-data-generator';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedLeads() {
  console.log('🌱 Starting lead seeding...');

  try {
    // 1. Get a Tenant
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .limit(1);

    if (tenantError || !tenants || tenants.length === 0) {
      throw new Error('No tenants found. Create a tenant first.');
    }

    const tenant = tenants[0];
    console.log(`Using Tenant: ${tenant.name} (${tenant.id})`);

    // 2. Get a Customer (Optional, effectively)
    const { data: users, error: userError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'customer')
      .eq('tenant_id', tenant.id)
      .limit(1);

    let customerId = undefined;
    if (users && users.length > 0) {
      customerId = users[0].user_id;
      console.log(`Assigning to Customer ID: ${customerId}`);
    } else {
      console.log('No specific customer found, creating unassigned leads');
    }

    // 3. Generate Leads
    const leads = generateMockLeads(25, tenant.id, customerId);

    // 4. Insert
    const { error: insertError } = await supabase.from('leads').insert(leads);

    if (insertError) {
      throw insertError;
    }

    console.log(`✅ Successfully inserted ${leads.length} mock leads!`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedLeads();
