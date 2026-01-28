
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log("--- DEBUGGING USER SERVICE FILTERS ---");

    // 1. Load Env Vars manually BEFORE imports
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

    // 2. Dynamic Import (so env.ts reads the populated process.env)
    const { UserService } = await import('../lib/services/user-service');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const client = createClient(supabaseUrl, supabaseServiceKey);
    const service = new UserService(client);

    // 3. Get Total Count (No filters)
    const allUsers = await service.getUsers(0, 100);
    console.log(`Total Users: ${allUsers.total}`);
    allUsers.data.forEach((u: any) => {
        console.log(`User: ${u.email}`);
        console.log(`- Tenants: ${JSON.stringify(u.tenants)}`);
    });

    // 4. Filter by Role: 'staff'
    console.log("\nFiltering by Role: 'staff'");
    const staffUsers = await service.getUsers(0, 100, { role: 'staff' });
    console.log(`Staff Users Found: ${staffUsers.total}`);
    staffUsers.data.forEach((u: any) => {
        console.log(`- ${u.email} (Roles: ${u.roles.map((r: any) => r.name).join(', ')})`);
    });

    // 5. Filter by Role: 'admin'
    console.log("\nFiltering by Role: 'admin'");
    const adminUsers = await service.getUsers(0, 100, { role: 'admin' });
    console.log(`Admin Users Found: ${adminUsers.total}`);
     adminUsers.data.forEach((u: any) => {
        console.log(`- ${u.email} (Roles: ${u.roles.map((r: any) => r.name).join(', ')})`);
    });

    if (staffUsers.total === allUsers.total && allUsers.total > 0 && adminUsers.total === allUsers.total) {
         // Weak check, assuming distribution
         console.log("\n❌ FAIL: Filter did not reduce count. (Returning ALL users despite filter)");
    } else {
        console.log("\n✅ PASS: Filter reduced count/changed results.");
    }
}

main();
