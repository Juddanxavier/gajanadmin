
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envFiles = ['.env', '.env.local'];
for (const file of envFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    // console.log(`Loading ${file}...`);
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

async function main() {
    try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabase = createAdminClient();
        
        console.log("Checking for 'users.create' permission...");
        const { data: perm, error } = await supabase
            .from('permissions')
            .select('*')
            .eq('name', 'users.create')
            .maybeSingle(); // Use maybeSingle to avoid error if not found
        
        if (error) {
            console.error("Error fetching permission:", error);
        } else if (perm) {
            console.log("Found permission:", perm);
             // Check if assigned to admin
             const { data: rolePerms } = await supabase
                .from('role_permissions')
                .select('*, roles(name)')
                .eq('permission_id', perm.id);
             console.log("Assigned to roles:", rolePerms?.map(rp => rp.roles.name));
        } else {
            console.log("Permission 'users.create' NOT FOUND.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
