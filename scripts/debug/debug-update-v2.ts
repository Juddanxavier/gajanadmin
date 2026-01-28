
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
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log("--- DEBUGGING TENANT UPDATE ---");

    // 1. Get a random user to test with
    const { data: users } = await adminClient.from("profiles").select("id, email").limit(1);
    if (!users || users.length === 0) {
        console.error("No users found.");
        return;
    }
    const testUser = users[0];
    console.log("Test User:", testUser.email);

    // 2. Get 2 Tenants
    const { data: tenants } = await adminClient.from("tenants").select("id, name").limit(2);
    if (!tenants || tenants.length < 2) {
        console.error("Need at least 2 tenants to test switching.");
        return;
    }
    const tenantA = tenants[0];
    const tenantB = tenants[1];

    console.log(`Switching from A (${tenantA.name}) to B (${tenantB.name})`);

    // 3. Clear existing tenants
    await adminClient.from("user_tenants").delete().eq("user_id", testUser.id);

    // 4. Set Tenant A
    console.log("Setting Tenant A...");
    const { error: insertErr } = await adminClient.from("user_tenants").insert({
        user_id: testUser.id,
        tenant_id: tenantA.id
    });
    if (insertErr) {
        console.error("Failed to set Tenant A:", insertErr);
        return;
    }

    // Verify A
    let { data: checkA } = await adminClient.from("user_tenants").select("tenant_id").eq("user_id", testUser.id);
    console.log("Current Tenant (Should be A):", checkA?.[0]?.tenant_id === tenantA.id ? "MATCH" : "MISMATCH");

    // 5. UPDATE to Tenant B (Simulating UserService.updateUser logic)
    console.log("Updating to Tenant B...");
    // Logic from UserService: delete then insert
    await adminClient.from("user_tenants").delete().eq("user_id", testUser.id);
    const { error: updateErr } = await adminClient.from("user_tenants").insert({
        user_id: testUser.id,
        tenant_id: tenantB.id
    });
    
    if (updateErr) console.error("Update Error:", updateErr);

    // 6. Verify B
    let { data: checkB } = await adminClient.from("user_tenants").select("tenant_id").eq("user_id", testUser.id);
    const result = checkB?.[0]?.tenant_id;
    
    console.log("Final Tenant ID:", result);
    console.log("Expected Tenant B:", tenantB.id);
    
    if (result === tenantB.id) {
        console.log("SUCCESS: Tenant updated correctly.");
    } else {
        console.log("FAILURE: Tenant update failed.");
    }
}

main();
