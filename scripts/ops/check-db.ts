
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envFiles = ['.env', '.env.local'];
for (const file of envFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`Loading ${file}...`);
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        
        // Handle KEY=VALUE
        const firstEquals = line.indexOf('=');
        if (firstEquals !== -1) {
            const key = line.substring(0, firstEquals).trim();
            let value = line.substring(firstEquals + 1).trim();
            // Remove quotes if present
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

async function main() {
    console.log("Checking DB...");
    try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabase = createAdminClient();
        
        console.log("--- PROFILES ---");
        const { data: profiles, error: pError } = await supabase.from("profiles").select("*");
        if (pError) console.error("Error fetching profiles:", pError);
        else console.log(`Found ${profiles?.length} profiles`);
        
        console.log("--- USER ROLES ---");
        const { data: roles, error: rError } = await supabase.from("user_roles").select("*");
        if (rError) console.error("Error fetching user_roles:", rError);
        else console.log(`Found ${roles?.length} user_roles`);

        console.log("--- USER TENANTS ---");
        const { data: tenants, error: tError } = await supabase.from("user_tenants").select("*");
        if (tError) console.error("Error fetching user_tenants:", tError);
        else console.log(`Found ${tenants?.length} user_tenants`);

        // RPC Checks
        console.log("--- RPC CHECKS ---");
        // Find an admin user ID from roles
        const adminRole = (await supabase.from("user_roles").select("user_id").eq("role", "admin").limit(1).single()).data;
        if (adminRole) {
            const userId = adminRole.user_id;
            console.log(`Testing RPCs for Admin User: ${userId}`);
            const { data: isAdminData, error: rpcError } = await supabase.rpc('is_admin', { user_uuid: userId });
            if (rpcError) console.error("RPC is_admin error:", rpcError);
            else console.log("is_admin result:", isAdminData);
        } else {
            console.log("No admin user found to test is_admin");
        }

        // Find any user for tenant check
        const anyUser = (await supabase.from("user_roles").select("user_id").limit(1).single()).data;
        if (anyUser) {
            const userId = anyUser.user_id;
            console.log(`Testing get_user_tenants for User: ${userId}`);
            const { data: tenantData, error: tenantRpcError } = await supabase.rpc('get_user_tenants', { user_uuid: userId });
            if (tenantRpcError) console.error("RPC get_user_tenants error:", tenantRpcError);
            else console.log("get_user_tenants result:", tenantData);
        }


        // ... (RPC checks)
    } catch (e) {
        console.error("Error in main:", e);
    }

    try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabase = createAdminClient();
        console.log("--- RLS POLICIES ---");
        const { data: policies, error } = await supabase
            .from('pg_policies')
            .select('tablename, policyname, cmd, qual, permissive');
        
        if (error) {
             // pg_policies is a system catalog, might not be accessible via PostgREST directly unless exposed? 
             // Usually it's better to use RPC to query it if direct access fails.
             // But often it works if exposed. 
             // If this fails, we might just assume RLS issue and try to fix it blindly or use existing migration files to infer.
             console.error("Error fetching policies (might need direct SQL):", error);
        } else {
            console.log("Policies found:", policies?.length);
            policies?.forEach(p => {
                if (['profiles', 'user_roles', 'user_tenants'].includes(p.tablename)) {
                    console.log(`Table: ${p.tablename}, Policy: ${p.policyname}, Cmd: ${p.cmd}`);
                }
            });
        }
    } catch (e) {
        console.error("Error checking policies:", e);
    }
}

main();
