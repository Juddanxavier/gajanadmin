
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// --- Load Env ---
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
  const { data, error } = await supabase
    .rpc('get_table_columns', { table_name: 'settings' });

  if (error) {
      // Fallback if rpc doesn't exist, try querying a row
      console.log('RPC failed, trying to fetch a row to see keys...');
      const { data: rows, error: rowError } = await supabase.from('settings').select('*').limit(1);
      if (rowError) {
          console.error('Error fetching settings:', rowError);
      } else if (rows && rows.length > 0) {
          console.log('Columns found in a row:', Object.keys(rows[0]));
      } else {
          console.log('No rows in settings table to inspect.');
      }
      return;
  }

  console.log('Columns:', data);
}

inspectSchema();
