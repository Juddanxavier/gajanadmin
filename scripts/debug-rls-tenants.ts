
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
    console.log("--- CHECKING RLS POLICIES ---");

    // Check if RLS is enabled on tenants
    const { data: dbInfo, error } = await adminClient.rpc('get_db_info'); // Hypothetical, usually we query pg tables directly or inspect
    // Actually, we can query `pg_tables` or `pg_class` if we had direct SQL access
    // But via client, we can test access.
    
    // We'll just test reading as a normal user.
    // We can't easily sign in as a user here without credentials.
    // Instead, we will inspect pg_policies via RPC if available?
    // I previously added inspection logic in check-db.ts.
    
    // Let's rely on listing policies
    const { data: policies } = await adminClient.from("pg_policies").select("*").eq("tablename", "tenants");
    console.log("Policies on 'tenants':", policies);
    
    // Also check RLS enabled status
    // querying pg_class and pg_namespace is hard via PostgREST unless exposed.
    
    // Alternative: Try to select top 1 tenant without admin key? 
    // I can't construct a non-admin client easily without an anon key + user token.
    // I'll just check if policies exist.
}

main();
