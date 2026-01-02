
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
    console.log("--- DEBUGGING USER TENANTS TABLE ---");

    // 1. Check user_tenants
    const { data: userTenants, error: utError } = await client.from("user_tenants").select("*");
    if (utError) console.error("Error fetching user_tenants:", utError);
    else {
        console.log(`Row count in user_tenants: ${userTenants.length}`);
        if (userTenants.length > 0) {
            console.log("First 3 rows:", userTenants.slice(0, 3));
        }
    }

    // 2. Check tenants
    const { data: tenants, error: tError } = await client.from("tenants").select("*");
    if (tError) console.error("Error fetching tenants:", tError);
    else {
        console.log(`Row count in tenants: ${tenants.length}`);
         if (tenants.length > 0) {
            console.log("First 3 rows:", tenants.slice(0, 3));
        }
    }
}

main();
