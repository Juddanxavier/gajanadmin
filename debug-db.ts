import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envConfig.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const key = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!url || !key) {
    console.error('Missing URL or Service Key');
    process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
    console.log('Checking Shipments Table...');
    const { count, error: countError } = await supabase.from('shipments').select('*', { count: 'exact', head: true });
    
    if (countError) {
        console.error('Count Error:', countError);
    } else {
        console.log('Total Shipments:', count);
    }

    const { data, error } = await supabase.from('shipments').select('*').limit(5);
    if (error) {
        console.error('Fetch Error:', error);
    } else {
        console.log('Sample Data:', JSON.stringify(data, null, 2));
    }
}

run();
