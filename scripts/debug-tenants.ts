
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
const env: Record<string, string> = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [k, v] = line.split('=');
        if (k && v) env[k.trim()] = v.trim();
    });
}
const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const key = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!url || !key) { console.error("Missing Env"); process.exit(1); }

const supabase = createClient(url, key);

async function run() {
    console.log("🔍 Debugging User Tenants Query...");

    // 1. Check basic listing
    const { data: raw, error: rawErr } = await supabase.from('user_tenants').select('*').limit(5);
    if (rawErr) console.error("Basic Select Error:", rawErr);
    else console.log("User Tenants Raw:", raw);

    // 2. Try the Join (Corrected columns)
    console.log("\nTrying Join with tenants...");
    const { data: joinData, error: joinErr } = await supabase
       .from('user_tenants')
       .select(`
            tenant_id,
            tenants (
                id,
                name
            )
       `)
       .limit(5);

    if (joinErr) {
        console.error("❌ Join Error:", joinErr);
    } else {
        console.log("✅ Join Success:", JSON.stringify(joinData, null, 2));
    }

    // 3. Fix for Multi-Tenant Testing
    console.log("\n--- Setting up Multi-Tenant Test Data ---");
    // Find our user (assuming first one found is the admin we are using)
    if (!raw || raw.length === 0) { console.error("No users found to link."); return; }
    
    const userId = raw[0].user_id; 
    console.log("Target User:", userId);

    // Create Second Tenant if not exists
    const SL_TENANT = { name: 'Gajan Sri Lanka', slug: 'gajan-sl' }; // slug might not be in schema, just name
    
    // Check if it exists
    const { data: existingSL } = await supabase.from('tenants').select('*').eq('name', SL_TENANT.name).single();
    let slTenantId = existingSL?.id;

    if (!existingSL) {
        console.log("Creating Tenant: Sri Lanka...");
        // Check schema for required fields. Assuming just name
        const { data: newTenant, error: createErr } = await supabase.from('tenants').insert({ name: SL_TENANT.name }).select().single();
        if (createErr) {
            console.error("Failed to create tenant:", createErr);
        } else {
            slTenantId = newTenant.id;
            console.log("Created Tenant ID:", slTenantId);
        }
    } else {
        console.log("Tenant Sri Lanka already exists:", slTenantId);
    }

    // Link User to SL Tenant
    if (slTenantId) {
        // Upsert to handle duplicates safely
        const { error: linkErr } = await supabase.from('user_tenants').upsert({
            user_id: userId,
            tenant_id: slTenantId
        }, { onConflict: 'user_id, tenant_id' });

        if (linkErr) console.error("Link Error:", linkErr);
        else console.log("✅ User linked to Sri Lanka Tenant!");
    }
}

run();
