
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
const url = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) { console.error("Missing Env"); process.exit(1); }

const supabase = createClient(url, key);

async function checkLogs() {
    console.log("🔍 Checking recent notification logs...");
    const { data: logs, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('sent_at', { ascending: false, nullsFirst: false }) // or created_at? schema has sent_at. failed ones might be null sent_at? 
        // Schema has `sent_at` and `created_at` (default now()). Let's order by created_at ideally, but I didn't verify created_at column existed in logs table def.
        // Let's check `id` descending (UUIDs aren't ordered).
        // Let's assume the table has a default timestamp or I added updated_at.
        // Step 933: notification_logs updated.
        // Existing table `notification_logs`: usually has `created_at`.
        .order('created_at', { ascending: false }) // Attempt created_at
        .limit(5);

    if (error) {
        // Fallback if created_at doesn't exist (it usually does automatically in Supabase)
         const { data: logs2, error: error2 } = await supabase.from('notification_logs').select('*').limit(5);
         if (logs2) console.table(logs2);
         else console.error(error);
         return;
    }

    if (logs && logs.length > 0) {
        console.table(logs.map(l => ({
            status: l.status,
            type: l.type,
            recipient: l.recipient,
            provider: l.provider_id,
            error: l.error_message ? l.error_message.substring(0, 50) + '...' : 'None'
        })));
        
        // Print full error of latest if failed
        if (logs[0].status === 'failed') {
            console.log("\n❌ Latest Error Detail:");
            console.log(logs[0].error_message);
            console.log("Metadata:", JSON.stringify(logs[0].metadata, null, 2));
        } else {
             console.log("\n✅ Latest Status:", logs[0].status);
             if (logs[0].status === 'sent') console.log("Provider ID:", logs[0].provider_id || 'System');
        }
    } else {
        console.log("No logs found.");
    }
}

checkLogs();
