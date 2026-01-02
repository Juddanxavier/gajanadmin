
// import fetch from 'node-fetch'; // Built-in fetch used
import * as fs from 'fs';
import * as path from 'path';

let API_KEY = '';
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('TRACK123_API_KEY=')) {
      API_KEY = line.split('=')[1].trim().replace(/^"|"$/g, '');
      break;
    }
  }
} catch (e) {
  console.error("Failed to read .env.local:", e);
}

if (!API_KEY) {
    console.error("API Key not found in .env.local!");
    process.exit(1);
}

const HEADERS = {
    'Track123-Api-Secret': API_KEY,
    'Content-Type': 'application/json',
};

const results: any[] = [];

async function testUri(name: string, url: string, method: string = 'POST') {
    console.log(`\n--- Testing ${name} (${url}) [${method}] ---`);
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: HEADERS,
            body: method === 'POST' ? '{}' : undefined
        });
        
        const text = await response.text();
        let json = null;
        try {
            json = JSON.parse(text);
        } catch {}

        results.push({
            name,
            url,
            method,
            status: response.status,
            statusText: response.statusText,
            responseRaw: text.substring(0, 500) + '...', // Truncate for log
            responseJsonSummary: json ? { code: json.code, msg: json.msg, count: json.data?.length || json.data?.list?.length } : null
        });

    } catch (e: any) {
        results.push({
            name,
            url,
            error: e.message
        });
    }
}

async function run() {
    // Test v2 and v2.1 courier list endpoints
    await testUri('v2 /courier/list POST', 'https://api.track123.com/gateway/open-api/tk/v2/courier/list', 'POST');
    await testUri('v2 /carrier/list POST', 'https://api.track123.com/gateway/open-api/tk/v2/carrier/list', 'POST'); 
    
    // Some APIs use GET
    await testUri('v2 /courier/list GET', 'https://api.track123.com/gateway/open-api/tk/v2/courier/list', 'GET');

    fs.writeFileSync('debug_log.json', JSON.stringify(results, null, 2));
    console.log("Done. Written to debug_log.json");
}

run();
