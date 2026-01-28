/** @format */
// scripts/import-shipments.ts

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load env
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const filePath =
  'c:\\websites\\kajen\\gajan\\admin\\Dail booking details as on 24th Jan 2026.xlsx';

async function importShipments() {
  console.log('🚀 Starting Import...');

  // 1. Get Tenant ID (First tenant in DB)
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);
  if (!tenants || tenants.length === 0) {
    console.error('❌ No tenants found in database. Cannot import.');
    process.exit(1);
  }
  const tenantId = tenants[0].id;
  console.log(`✅ Using Tenant ID: ${tenantId}`);

  // 2. Read Excel
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`📊 Found ${rows.length} rows.`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const row of rows) {
    const trackingNo = row['AWB Number']
      ? String(row['AWB Number']).trim()
      : '';

    // Skip invalid rows
    if (!trackingNo || trackingNo === 'undefined') {
      console.log(`⚠️ Skipping row (No AWB): ${row['Customer Name']}`);
      skipCount++;
      continue;
    }

    // Format Data
    const firstName = row['Customer Name'] || '';
    const surname = row['Surname'] || '';
    const fullName = `${firstName} ${surname}`.trim();

    const carrierService = row['Service'] || 'Manual';
    const country = row['COUNTRY'] || '';

    // Date Parsing (DD.MM.YYYY)
    let createdDate = new Date();
    if (row['Date']) {
      const [d, m, y] = String(row['Date']).split('.');
      if (d && m && y) {
        createdDate = new Date(`${y}-${m}-${d}`);
      }
    }

    console.log(
      `📦 Importing: ${trackingNo} | ${fullName} | ${carrierService} | ${country}`,
    );

    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('shipments')
        .select('id')
        .eq('carrier_tracking_code', trackingNo)
        .maybeSingle();

      if (existing) {
        console.log(`   ⏭️ Exists. Skipping.`);
        skipCount++;
        continue;
      }

      // ENSURE CARRIER EXISTS
      const carrierId = carrierService.toLowerCase().replace(/\s/g, '_');
      const { error: carrierError } = await supabase.from('carriers').upsert(
        {
          code: carrierId,
          name_en: carrierService,
          name_cn: carrierService,
        },
        { onConflict: 'code', ignoreDuplicates: true },
      );

      if (carrierError) console.warn('Carrier warning:', carrierError.message);

      // Insert directly via Supabase to ensure isArchived Logic (status=delivered)
      // We bypass service wrapper here to be self-contained script or we could use service?
      // Let's Insert Direct to be faster and simpler for script.

      const { error } = await supabase.from('shipments').insert({
        tenant_id: tenantId,
        white_label_code: `IMP-${trackingNo}-${Date.now()}`, // Unique Code
        carrier_tracking_code: trackingNo,
        provider: 'manual', // or generic
        carrier_id: carrierService.toLowerCase().replace(/\s/g, '_'),
        status: 'delivered', // HISTORICAL = DELIVERED
        customer_details: {
          name: fullName,
          email: '', // Not in excel
          phone: '', // Not in excel
        },
        origin_country: 'India', // Assumption based on "Booked from: SAIDAPET"
        destination_country: country,
        latest_location: 'Historical Data Entry',
        created_at: createdDate.toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Add "Delivered" event
      await supabase.from('tracking_events').insert({
        shipment_id: (
          await supabase
            .from('shipments')
            .select('id')
            .eq('carrier_tracking_code', trackingNo)
            .single()
        ).data!.id,
        status: 'delivered',
        description: `Imported historical shipment (Service: ${carrierService})`,
        location: country,
        occurred_at: createdDate.toISOString(),
      });

      console.log(`   ✅ Imported!`);
      successCount++;
    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.message}`);
      failCount++;
    }
  }

  console.log('\n--- IMPORT SUMMARY ---');
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️ Skipped: ${skipCount}`);
  console.log(`❌ Failed:  ${failCount}`);
}

importShipments();
