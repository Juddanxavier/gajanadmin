import fs from 'fs';
import path from 'path';

// --- Load Env (Robust) ---
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envConfig.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const apiKey = env['TRACK123_API_KEY'];

if (!apiKey) {
    console.error('Missing API Key in .env.local');
    process.exit(1);
}

// --- Mocking Type Definitions ---
type ShipmentStatus = 'created' | 'pending' | 'info_received' | 'in_transit' | 'out_for_delivery' | 'attempt_fail' | 'delivered' | 'exception' | 'expired' | 'invalid';

interface TrackingCheckpoint {
  occurred_at: string;
  description: string;
  location: string;
  status: ShipmentStatus;
  raw_status?: string;
}

interface TrackingResult {
  tracking_number: string;
  carrier_code: string;
  status: ShipmentStatus;
  estimated_delivery?: string;
  checkpoints: TrackingCheckpoint[];
  raw_response: any;
}

// --- Logic from Track123Provider ---
class Track123Parsers {
    
  static mapStatus(raw: string): ShipmentStatus {
    const s = (raw || '').toLowerCase();
    if (s.includes('delivered')) return 'delivered';
    if (s.includes('transit')) return 'in_transit';
    if (s.includes('pending')) return 'pending';
    if (s.includes('info')) return 'info_received';
    if (s.includes('fail')) return 'attempt_fail';
    if (s.includes('exception')) return 'exception';
    if (s.includes('expired')) return 'expired';
    if (s.includes('out')) return 'out_for_delivery';
    return 'pending'; // Default
  }

  static normalizeResponse(data: any): TrackingResult {
    // Attempt multiple roots based on possible API structures
    const t = data.tracking || data;
    
    // Checkpoints
    const checkpoints: TrackingCheckpoint[] = (data.checkpoints || []).map((cp: any) => ({
      occurred_at: cp.created_at || cp.time || new Date().toISOString(),
      location: cp.location || cp.city,
      description: cp.message || cp.status_name,
      status: this.mapStatus(cp.status),
      raw_status: cp.status
    }));

    // Sort descending
    checkpoints.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

    // --- CARRIER EXTRACTION ---
    // Log what we found to debug
    const candidates = {
        't.carrier_code': t.carrier_code,
        'data.courierCode': data.courierCode,
        'data.CourierCode': data.CourierCode,
        'data.carrierId': data.carrierId
    };
    console.log('[Debug] Carrier Candidates:', JSON.stringify(candidates, null, 2));

    const carrierCode = t.carrier_code || data.courierCode || data.CourierCode || data.carrierId || '';
    
    // --- STATUS EXTRACTION ---
    let status = this.mapStatus(data.status || data.trackStatus);
    
    console.log(`[Debug] Initial Mapped Status: ${status} (from ${data.status || data.trackStatus})`);
    
    if (status === 'pending' && checkpoints.length > 0) {
         status = checkpoints[0].status;
         console.log(`[Debug] Fallback to latest checkpoint status: ${status}`);
    }

    return {
      tracking_number: t.tracking_number || data.trackNo || '',
      carrier_code: carrierCode,
      status: status,
      estimated_delivery: data.expected_delivery,
      checkpoints,
      raw_response: data
    };
  }
}

// --- Main Execution ---
async function runTest(trackingNumber: string) {
    console.log(`\n--- Fetching Tracking for: ${trackingNumber} ---`);
    
    try {
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

        if (!res.ok) {
            console.error('API Request Failed:', res.status, res.statusText);
            const txt = await res.text();
            console.error(txt);
            return;
        }

        const json = await res.json();
        
        // Find the tracking data in the response
        // Usually data.data.list[0] or data.data.accepted[0] depending on endpoint version/response
        const rawItem = json.data?.list?.[0] || json.data?.accepted?.[0];

        if (!rawItem) {
            console.error('No tracking item found in response data.list or data.accepted');
            console.log('Full Response:', JSON.stringify(json, null, 2));
            return;
        }

        console.log('Raw Item Keys:', Object.keys(rawItem).join(', '));
        
        // RUN NORMALIZER
        const result = Track123Parsers.normalizeResponse(rawItem);
        
        console.log('\n--- FINAL PARSED RESULT ---');
        console.log('Carrier Code:', result.carrier_code ? `'${result.carrier_code}'` : '(EMPTY)');
        console.log('Status      :', result.status);
        console.log('Checkpoints :', result.checkpoints.length);

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

// Get from CLI arg or default
const trackingNo = process.argv[2] || 'YT2436521272004481'; // Replace with a failing one if known
runTest(trackingNo);
