
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
    console.log("--- DEBUGGING RPC ERROR ---");

    const { data: usersResponse } = await adminClient.auth.admin.listUsers();
    const user = usersResponse.users[0];
    
    if (!user) {
        console.log("No users found.");
        return;
    }
    console.log(`Testing User: ${user.email} (${user.id})`);

    console.log("Testing user_has_permission RPC...");
    const { data, error } = await adminClient.rpc('user_has_permission', {
        user_uuid: user.id,
        permission_name_param: 'users.create'
    });

    if (error) {
        console.error("RPC Error:", error);
    } else {
        console.log("RPC Data:", data);
    }
}

main();
