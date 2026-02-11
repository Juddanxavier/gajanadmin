/** @format */

import { createAdminClient } from '@/lib/supabase/admin';

async function debugShipments() {
  const supabase = createAdminClient();

  console.log('Fetching all shipments via Admin Client...');
  const { data: shipments, error } = await supabase
    .from('shipments')
    .select('id, status, created_at, tenant_id, carrier_id');

  if (error) {
    console.error('Error fetching shipments:', error);
    return;
  }

  console.log(`Found ${shipments?.length ?? 0} total shipments in DB.`);

  if (shipments && shipments.length > 0) {
    console.log('Sample Shipments:');
    shipments.forEach((s) => {
      console.log(
        `- ID: ${s.id}, Status: ${s.status}, Created: ${s.created_at}, Tenant: ${s.tenant_id}`,
      );
    });
  } else {
    console.log('No shipments found in the database.');
  }
}

debugShipments();
