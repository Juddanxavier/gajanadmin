
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

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log("--- DEBUGGING PERMISSIONS ---");

    // 1. Get a user to test (First user in DB)
    const { data: usersResponse } = await adminClient.auth.admin.listUsers();
    const user = usersResponse.users[0];
    
    if (!user) {
        console.log("No users found to test.");
        return;
    }
    console.log(`Testing User: ${user.email} (${user.id})`);

    // 2. Check Roles
    const { data: userRoles } = await adminClient
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);
    console.log("User Roles:", userRoles);

    // 3. Check Permissions in DB
    const { data: perms } = await adminClient
        .from('permissions')
        .select('id, name')
        .in('name', ['users.create', 'users.update']);
    console.log("Permissions found in DB:", perms);

    // 4. Check Role Permissions
    if (userRoles?.length && perms?.length) {
        const roleNames = userRoles.map(ur => ur.role);
        const { data: rolePerms } = await adminClient
            .from('role_permissions')
            .select('role_id, permission_id, roles(name), permissions(name)')
            .in('roles.name', roleNames) // filter by role name via join? No, complex.
        
        // Simpler: Fetch all role perms for 'admin'
        const { data: adminRole } = await adminClient.from('roles').select('id').eq('name', 'admin').single();
        if (adminRole) {
            const { data: adminPerms } = await adminClient
                .from('role_permissions')
                .select('permissions(name)')
                .eq('role_id', adminRole.id);
            console.log("Admin Role Permissions:", adminPerms?.map((ap: any) => ap.permissions.name));
        }
    }

    // 5. Test RPC
    console.log("Testing user_has_permission RPC...");
    const { data: hasCreate } = await adminClient.rpc('user_has_permission', {
        user_uuid: user.id,
        permission_name_param: 'users.create'
    });
    console.log(`RPC users.create: ${hasCreate}`);

    const { data: hasUpdate } = await adminClient.rpc('user_has_permission', {
        user_uuid: user.id,
        permission_name_param: 'users.update'
    });
    console.log(`RPC users.update: ${hasUpdate}`);
}

main();
