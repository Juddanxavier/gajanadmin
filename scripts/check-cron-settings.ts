
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(url, key);

async function checkSettings() {
    console.log('Checking database settings...');
    
    // Check app.api_url
    const { data: apiUrl, error: apiError } = await supabase.rpc('get_config', { setting_name: 'app.api_url' });
    
    // We can't easily check arbitrary settings without a helper RPC or admin access.
    // But we can try to "select current_setting('app.api_url', true)" if we had a SQL tool.
    // Instead, let's just warn the user.
    
    console.log(`
    IMPORTANT:
    This cron job requires 'app.api_url' and 'app.cron_secret' to be set in your database.
    
    You can set them in the Supabase Dashboard -> SQL Editor:
    
    ALTER DATABASE postgres SET app.api_url = 'https://your-project.vercel.app';
    ALTER DATABASE postgres SET app.cron_secret = '${process.env.CRON_SECRET || 'your-secret-here'}';
    `);
    
    if (!process.env.CRON_SECRET) {
        console.warn('WARNING: CRON_SECRET is not set in .env.local. The cron job endpoint will reject requests.');
    }
}

checkSettings();
