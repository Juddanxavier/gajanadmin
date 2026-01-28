
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

const client = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log("--- DEBUGGING FILTERS ---");

    // 1. Fetch ALL users to see what we have
    const { count: total } = await client.from("profiles").select("*", { count: 'exact', head: true });
    console.log(`Total Profiles in DB: ${total}`);

    // 2. Test FILTER BY ROLE: 'staff'
    // Current Logic (simulating what I think is in UserService)
    console.log("\nTesting current logic (implicit left join)...");
    const { data: data1, error: error1 } = await client
        .from("profiles")
        .select(`
            email,
            user_roles (role)
        `)
        .eq("user_roles.role", "staff");

    if (error1) console.error("Query 1 Error:", error1);
    else console.log(`Query 1 Results (Filter: staff): ${data1?.length} rows found.`);

    // 3. Test FILTER BY ROLE with INNER JOIN
    console.log("\nTesting !inner join logic...");
    const { data: data2, error: error2 } = await client
        .from("profiles")
        .select(`
            email,
            user_roles!inner (role)
        `)
        .eq("user_roles.role", "staff");

    if (error2) console.error("Query 2 Error:", error2);
    else console.log(`Query 2 Results (Filter: staff, !inner): ${data2?.length} rows found.`);
}

main();
