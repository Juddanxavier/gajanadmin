
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// --- Load Env (Manual) ---
const envPath = path.resolve(process.cwd(), '.env.local');
const env: Record<string, string> = {};
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim();
    });
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('URL:', supabaseUrl);
console.log('Key (start):', supabaseServiceKey?.substring(0, 5));

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    const id = '208b2fc5-cc29-4a30-a82d-3bad62e8aaf0'; // The one found in inspect-shipments
    console.log('Fetching shipment:', id);

    const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Found:', data?.id);
    }
}

run();
