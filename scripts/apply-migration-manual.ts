
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
const env: Record<string, string> = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [k, v] = line.split('=');
        if (k && v) env[k.trim()] = v.trim();
    });
}
const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const key = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!url || !key) { console.error("Missing Env"); process.exit(1); }

const supabase = createClient(url, key);

const migration = `
BEGIN;
ALTER TABLE tenant_notification_configs ALTER COLUMN tenant_id DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_global_active_provider ON tenant_notification_configs (channel) WHERE is_active = true AND tenant_id IS NULL;
COMMIT;
`;

async function run() {
    console.log("Applying Migration...");
    const { error } = await supabase.rpc('exec_sql', { sql: migration }); // Try RPC first?
    // RPC exec_sql is usually custom. If not exists, we use RAW SQL via library if possible?
    // Supabase-js doesn't expose raw SQL query exec for security unless via RPC.
    // BUT we are using Service Role. 
    // Actually, `supabase-js` doesn't do raw SQL.
    // I should use `psql` command via `run_command` if available? Or just tell user.
    // Wait, I can use the `mcp` tool `execute_sql`? No, it failed authentication.
    
    // Fallback: Just print it for the user or try to use a specialized admin function if I created one.
    // I don't have a generic exec_sql RPC.
    
    console.log("Migration SQL:");
    console.log(migration);
    console.log("---------------------------------------------------");
    console.log("CRITICAL: Code cannot apply schema changes directly.");
    console.log("Please run the SQL above in your Supabase SQL Editor.");
}

run();
