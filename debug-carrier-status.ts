import fs from 'fs';
import path from 'path';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envConfig.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const apiKey = env['TRACK123_API_KEY'];

if (!apiKey) {
    console.error('Missing API Key');
    process.exit(1);
}

// Mock Provider logic
async function testTracking(trackingNumber: string) {
    console.log(`Testing: ${trackingNumber}`);
    const res = await fetch('https://api.track123.com/gateway/open-api/tk/v2/track/query', {
        method: 'POST',
        headers: {
            'Track123-Api-Secret': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            trackNoInfos: [{ trackNo: trackingNumber }]
        })
    });

    const data = await res.json();
    console.log('Raw Response captured.');
    fs.writeFileSync('debug-output.json', JSON.stringify(data, null, 2));
    
    // Simulate Parsing logic
    const item = data.data?.list?.[0] || data.data?.accepted?.[0]?.content;
    if (item) {
        console.log('Parsed Carrier:', item.courierCode || item.wrapper?.courierCode);
        console.log('Parsed Status Code:', item.status || item.trackStatus);
        console.log('Parsed Status Description:', item.latestEvent);
    } else {
        console.log('No item found in list/accepted');
    }
}

// Test with a known tracking number (or one causing issues)
testTracking('YT2436521272004481'); // Example or generic
