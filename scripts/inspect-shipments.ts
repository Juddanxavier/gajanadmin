
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// --- Load Env (Manual) ---
const envPath = path.resolve(process.cwd(), '.env.local');
const env: Record<string, string> = {};
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim();
    });
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectShipments() {
  console.log('🔍 Inspecting Shipments...');
  
  const { data, error } = await supabase
    .from('shipments')
    .select('id, carrier_tracking_code, tenant_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error fetching shipments:', error);
    return;
  }

  console.log(`Found ${data.length} recent shipments:`);
  data.forEach(s => {
      console.log(`- ID: ${s.id} | Track: ${s.carrier_tracking_code} | Tenant: ${s.tenant_id} | Status: ${s.status}`);
  });
}

inspectShipments();
