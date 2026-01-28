import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// --- Load Env ---
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envConfig.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const apiKey = env['TRACK123_API_KEY'];
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Env Variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    console.log('Fetching carriers from Track123...');
    const res = await fetch('https://api.track123.com/gateway/open-api/tk/v2.1/courier/list', {
        headers: {
            'Track123-Api-Secret': apiKey,
            'Content-Type': 'application/json'
        }
    });

    if (!res.ok) {
        console.error('API Error:', res.status, res.statusText);
        return;
    }

    const json = await res.json();
    const list = json.data || [];
    
    console.log(`Found ${list.length} carriers. Syncing to DB...`);

    // Batch Insert/Upsert
    // Structure from Track123 API: { courierCode, courierNameEN, courierNameCN, courierHomePage }
    // Map to our DB structure: { code, name_en, name_cn, homepage }
    // Filter out carriers with null/empty code or both names empty
    const records = list
        .map((c: any) => ({
            code: c.courierCode,
            name_en: c.courierNameEN || null,
            name_cn: c.courierNameCN || null,
            homepage: c.courierHomePage || null
        }))
        .filter((c: any) => 
            c.code && 
            c.code.trim() !== '' && 
            (c.name_en || c.name_cn) // At least one name must exist
        );

    console.log(`Valid carriers after filtering: ${records.length}`);

    if (records.length === 0) {
        console.log('No valid carriers to sync.');
        return;
    }

    // Upsert in chunks of 1000 to be safe
    const chunkSize = 1000;
    for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const { error } = await supabase
            .from('carriers')
            .upsert(chunk, { onConflict: 'code' });
        
        if (error) {
            console.error('DB Upsert Error:', error);
        } else {
            console.log(`Synced ${chunk.length} items...`);
        }
    }

    console.log('Done!');
}

run();
