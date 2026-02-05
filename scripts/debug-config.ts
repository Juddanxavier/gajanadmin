/** @format */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const shipmentId = '58b8cbba-16f9-45b6-a907-6a615fb2381d'; // From user log

  // 1. Get Tenant From Shipment
  const { data: shipment } = await supabase
    .from('shipments')
    .select('tenant_id')
    .eq('id', shipmentId)
    .single();

  if (!shipment) {
      console.log('Shipment not found');
      return;
  }
  
  console.log('Tenant ID:', shipment.tenant_id);

  // 2. Check Config
  const { data: config } = await supabase
    .from('tenant_notification_configs')
    .select('*')
    .eq('tenant_id', shipment.tenant_id);

  console.log('Configs found:', config?.length);
  console.log(config);

  // 3. Check Templates
  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .eq('tenant_id', shipment.tenant_id);
    
  console.log('Templates found:', templates?.length);
  console.log(templates);
}

main();
