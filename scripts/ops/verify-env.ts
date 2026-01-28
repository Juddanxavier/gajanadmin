
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

console.log("\n🔍 --- VERIFYING ENVIRONMENT ---\n");

// 1. Manually Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const env: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    console.log("✅ .env.local file found.");
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim();
    });
} else {
    console.error("❌ .env.local file NOT found!");
    process.exit(1);
}

// 2. Check Variables
const url = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`\nChecking NEXT_PUBLIC_SUPABASE_URL: ${url ? '✅ Present' : '❌ MISSING'}`);
console.log(`Checking SUPABASE_SERVICE_ROLE_KEY:  ${key ? '✅ Present' : '❌ MISSING'}`);

if (key) {
    if (key.includes('your_service_role_key_here')) {
        console.error("\n❌ ERROR: You still have the PLACEHOLDER string 'your_service_role_key_here'.");
        console.error("👉 ACTION: Open .env.local and PASTE your actual Service Role Key.");
        process.exit(1);
    }
    console.log(`Key Length: ${key.length} (Should be roughly 200+ characters)`);
} else {
    process.exit(1);
}

// 3. Test Connection
if (url && key) {
    console.log("\nTesting Connection to Supabase...");
    const supabase = createClient(url, key);
    
    // Perform a simple query (e.g. valid 'auth.users' fetch or just a table check)
    // admin client interacts well with auth.
    supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
        .then(({ data, error }) => {
            if (error) {
                console.error("\n❌ Connection FAILED:", error.message);
                if (error.message.includes('Invalid authentication')) {
                     console.error("👉 The Key you pasted is invalid. Ensure it is the SERVICE_ROLE key, not Anon/Public.");
                }
            } else {
                console.log("\n✅ SUCCESS! Connected to Supabase with Admin privileges.");
                console.log(`Found ${data.users.length} users (verification sample).`);
            }
        });
}
