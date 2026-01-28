
import 'dotenv/config';
import { Client } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
try {
  const envConfig = readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      // Handle quoted values simply
      let val = value.trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key.trim()] = val;
    }
  });
} catch (e) {
  console.log('Could not read .env.local');
}

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('Missing SUPABASE_DB_URL in .env.local');
  process.exit(1);
}

async function run() {
  console.log('--- 🧹 Cleaning Supabase Notification Tables ---');
  
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    const tables = ['notifications', 'notification_logs', 'tenant_notification_configs'];
    
    for (const table of tables) {
        console.log(`Dropping table: ${table}...`);
        // Use CASCADE to remove dependent objects if any
        await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`✅ Dropped ${table}`);
    }

    console.log('\nCleanup complete.');
  } catch (err) {
    console.error('Error executing cleanup:', err);
  } finally {
    await client.end();
  }
}

run();
