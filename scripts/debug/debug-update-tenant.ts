
import { createClient } from '@supabase/supabase-js';
import { UserService } from '../lib/services/user-service';
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

const client = createClient(supabaseUrl, supabaseServiceKey);
const service = new UserService(client);

async function main() {
    console.log("--- DEBUGGING USER UPDATE ---");

    // 1. Get a test user (or create one)
    // We'll pick the first user found
    const { data: users } = await client.from("profiles").select("id, email").limit(1);
    if (!users || users.length === 0) {
        console.error("No users found to test.");
        return;
    }
    const testUser = users[0];
    console.log("Testing with user:", testUser.email, testUser.id);

    // 2. Get available tenants to switch to
    const { data: tenants } = await client.from("tenants").select("id, name").order("name");
    if (!tenants || tenants.length < 1) {
         console.error("No tenants found.");
         return;
    }
    const targetTenant = tenants[0]; 
    console.log("Targeting Tenant:", targetTenant.name, targetTenant.id);

    // 3. Perform Update via Service
    console.log("Updating user...");
    try {
        await service.updateUser(testUser.id, {
            roles: ["staff"], // Assume staff role
            tenants: [targetTenant.id]
        }, "SYSTEM_DEBUG_SCRIPT"); // Fake updater ID
        console.log("Update completed.");
    } catch (e) {
        console.error("Update FAILED:", e);
    }

    // 4. Verify Database State
    console.log("Verifying DB state...");
    
    // Check user_roles
    const { data: roles } = await client.from("user_roles").select("*").eq("user_id", testUser.id);
    console.log("User Roles:", roles);

    // Check user_tenants
    const { data: userTenants } = await client.from("user_tenants").select("*").eq("user_id", testUser.id);
    console.log("User Tenants:", userTenants);

    if (userTenants && userTenants.length > 0 && userTenants[0].tenant_id === targetTenant.id) {
        console.log("SUCCESS: Tenant was persisted correctly.");
    } else {
        console.log("FAILURE: Tenant NOT found or incorrect.");
    }
}

main();
