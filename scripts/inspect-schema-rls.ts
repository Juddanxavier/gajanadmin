
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
    console.log("🔍 Inspecting Tables & RLS...");

    // 1. List Tables and Columns (Simulated via querying data or getting types)
    // Since we can't query information_schema easily without permissions or correct helper,
    // we will infer from querying one row of each suspected table.
    
    const potentialTables = ['shipments', 'leads', 'users', 'profiles', 'staff', 'user_roles'];
    
    for (const table of potentialTables) {
        console.log(`\nChecking table: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ Table likely missing or inaccessible: ${error.message}`);
        } else {
            console.log(`✅ Table exists.`);
            if (data && data.length > 0) {
                console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
                if ('tenant_id' in data[0]) console.log("   🎯 Has tenant_id column! (Isolation possible)");
                else console.log("   ⚠️ Missing tenant_id column! (Needs migration)");
            } else {
                console.log("   (Table empty, cannot verify columns dynamically)");
            }
        }
    }

    // 2. Check for RLS Policies
    // We can't see policies via JS Client directly. We have to assume they might be missing.
    // However, we can try to "Test" access with a fake user token if we wanted, but that's complex.
    // For now, we will assume we need to re-apply robust policies.
    
    console.log("\n--- Verification Plan ---");
    console.log("We will likely need to create a migration to:");
    console.log("1. Add 'tenant_id' to `leads`, `profiles` if missing.");
    console.log("2. Enable RLS on all these tables.");
    console.log("3. Create Policy: 'Users can only see rows where table.tenant_id match user_tenants.tenant_id'");
}

run();
