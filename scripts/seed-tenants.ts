/** @format */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedTenants() {
  console.log('🌍 Seeding Tenants: India & Sri Lanka\n');

  try {
    // Define tenants
    const tenants = [
      {
        name: 'Gajan Traders India',
        slug: 'india',
        country_code: 'IN',
        is_active: true,
      },
      {
        name: 'Gajan Traders Sri Lanka',
        slug: 'sri-lanka',
        country_code: 'LK',
        is_active: true,
      },
    ];

    console.log('1️⃣ Inserting tenants...');

    for (const tenant of tenants) {
      const { data, error } = await supabase
        .from('tenants')
        .upsert(tenant, {
          onConflict: 'slug',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error inserting ${tenant.name}:`, error.message);
      } else {
        console.log(`✅ ${tenant.name} (${tenant.slug})`);
        console.log(`   ID: ${data.id}`);
        console.log(`   Country: ${tenant.country_code}`);
      }
    }

    console.log('\n2️⃣ Verifying tenants...');
    const { data: allTenants, error: fetchError } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching tenants:', fetchError.message);
    } else {
      console.log(`✅ Total tenants in database: ${allTenants?.length || 0}`);
      allTenants?.forEach((t, index) => {
        console.log(
          `   ${index + 1}. ${t.name} (${t.slug}) - ${t.country_code}`,
        );
      });
    }

    console.log('\n3️⃣ Checking settings auto-creation...');
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('tenant_id, company_name');

    if (settingsError) {
      console.log('⚠️  Could not fetch settings:', settingsError.message);
    } else {
      console.log(`✅ Settings records: ${settings?.length || 0}`);
      if (settings && settings.length > 0) {
        settings.forEach((s) => {
          console.log(`   - Tenant ID: ${s.tenant_id}`);
        });
      }
    }

    console.log('\n4️⃣ Checking email templates auto-creation...');
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('tenant_id, type');

    if (templatesError) {
      console.log('⚠️  Could not fetch templates:', templatesError.message);
    } else {
      console.log(`✅ Email template records: ${templates?.length || 0}`);
      const templatesByTenant = templates?.reduce((acc: any, t) => {
        acc[t.tenant_id] = (acc[t.tenant_id] || 0) + 1;
        return acc;
      }, {});

      if (templatesByTenant) {
        Object.entries(templatesByTenant).forEach(([tenantId, count]) => {
          console.log(`   - Tenant ${tenantId}: ${count} templates`);
        });
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 TENANT SEEDING SUMMARY');
    console.log('='.repeat(70));
    console.log('Tenants Created: India, Sri Lanka');
    console.log('Total Tenants:', allTenants?.length || 0);
    console.log('Status: ✅ Complete');
    console.log('='.repeat(70));

    console.log('\n💡 Next Steps:');
    console.log('1. Assign users to tenants using user_tenants table');
    console.log('2. Configure tenant-specific settings');
    console.log('3. Set up notification providers for each tenant');

    console.log('\n📝 Example: Assign user to India tenant');
    console.log('INSERT INTO user_tenants (user_id, tenant_id)');
    console.log("SELECT '<user_id>', id FROM tenants WHERE slug = 'india';");
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

seedTenants();
