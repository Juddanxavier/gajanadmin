/** @format */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLeadsService() {
  console.log('🧪 Testing LeadsService...');

  try {
    const { LeadsService } = await import('../lib/services/leads-service');
    const service = new LeadsService(supabase);
    // Mimic admin call (undefined tenantIds)
    console.log('Fetching leads (Admin mode)...');
    const result = await service.getLeads(
      0,
      10,
      {},
      { id: 'created_at', desc: true },
    );

    console.log(`✅ Success! Found ${result.total} leads.`);
    if (result.data.length > 0) {
      console.log('Sample lead:', JSON.stringify(result.data[0], null, 2));
    } else {
      console.log('⚠️ No leads found.');
    }
  } catch (error) {
    console.error('❌ LeadsService failed:', error);
  }
}

testLeadsService();
