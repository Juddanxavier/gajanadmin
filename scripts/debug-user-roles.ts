
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envConfig.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const key = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!url || !key) {
    console.error('Missing URL or Service Key');
    process.exit(1);
}

const supabase = createClient(url, key);

async function checkRoles() {
    console.log("Checking roles...");
    
    // Get all users
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error("Error listing users:", userError);
        return;
    }

    if (!users.users.length) {
        console.log("No users found.");
        return;
    }

    for (const user of users.users) {
        console.log(`\nUser: ${user.email} (${user.id})`);
        
        // Fetch roles
        const { data: userRoles, error: roleError } = await supabase
            .from('user_roles')
            .select('role_id, roles(name)')
            .eq('user_id', user.id);
            
        if (roleError) {
            console.error("  Error fetching roles:", roleError);
        } else {
            if (userRoles && userRoles.length > 0) {
                 userRoles.forEach((ur: any) => {
                     console.log(`  - Role: ${ur.roles?.name} (ID: ${ur.role_id})`);
                 });
            } else {
                console.log("  - No roles assigned.");
                
                // Attempt to fix if "admin" role exists
                console.log("  -> Attempting to assign 'admin' role...");
                const { data: adminRole } = await supabase.from('roles').select('id').eq('name', 'admin').single();
                if (adminRole) {
                    // check tenant
                     const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
                     if (tenant) {
                         const { error: assignError } = await supabase.from('user_roles').insert({
                             user_id: user.id,
                             role_id: adminRole.id,
                             tenant_id: tenant.id
                         });
                         if (assignError) console.error("     Failed to assign:", assignError);
                         else console.log("     Assigned 'admin' role successfully.");
                     } else {
                         console.error("     No tenant found to assign role to.");
                     }
                } else {
                    console.error("     'admin' role definition not found in DB.");
                }
            }
        }
    }
}

checkRoles();
