
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envFiles = ['.env', '.env.local'];
for (const file of envFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const firstEquals = line.indexOf('=');
        if (firstEquals !== -1) {
            const key = line.substring(0, firstEquals).trim();
            let value = line.substring(firstEquals + 1).trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log("--- DEBUGGING USER FETCH ---");

    // 1. Check Permissions exist
    console.log("\n1. Checking 'users.view' permission...");
    const { data: perms, error: permError } = await adminClient
        .from('permissions')
        .select('*')
        .in('name', ['users.view', 'users.create', 'users.manage']);
    
    if (permError) console.error("Error fetching permissions:", permError);
    else {
        console.log("Found permissions:", perms?.map(p => p.name));
        if (!perms?.find(p => p.name === 'users.view')) {
            console.error("CRITICAL: 'users.view' permission is MISSING! Did you run the migration?");
        }
    }

    // 2. Check Profiles Count (Admin Access)
    console.log("\n2. Checking Profiles count (Admin Client)...");
    const { count: profileCount, error: countError } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true });
    
    if (countError) console.error("Error counting profiles:", countError);
    else console.log(`Total Profiles in DB: ${profileCount}`);

    // 3. Simulate UserService Query (Admin Client version)
    // We want to see if the QUERY structure itself is valid and returns data
    console.log("\n3. Testing UserService Query Structure (Admin Client)...");
    const { data: users, error: userError } = await adminClient
        .from("profiles")
        .select(`
            id,
            email,
            display_name,
            full_name,
            user_roles (
                role,
                tenant_id
            ),
            user_tenants (
                tenant_id
            )
        `)
        .limit(5);

    if (userError) {
        console.error("UserService Query FAILED:", userError);
    } else {
        console.log(`Query returned ${users?.length} rows.`);
        if (users?.length! > 0) {
            console.log("Sample User:", JSON.stringify(users![0], null, 2));
        } else {
            console.log("Query returned NO rows even with Admin Client. Data might be missing or joins are failing.");
        }
    }

    // 4. Check RLS Policies (Indirectly)
    // We can't query pg_policies easily without raw SQL, but check-db previously failed on that.
    // If Admin Client sees data but UI doesn't, it is 100% RLS or Auth Context.
    
    console.log("\n--- END DEBUG ---");
}

main();
