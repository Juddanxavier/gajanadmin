import 'dotenv/config';
import crypto from 'crypto';
// @ts-ignore
import fetch from 'node-fetch'; // Standard fetch is global in Node 18+, but for safety in scripts
import { readFileSync } from 'fs';
import path from 'path';

// Load env directly if dotenv doesn't pick up .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
try {
  const envConfig = readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
} catch (e) {
  console.log('Could not read .env.local, relying on process.env');
}

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/track123';
const API_KEY = process.env.TRACK123_API_KEY;

if (!API_KEY) {
  console.error('Error: TRACK123_API_KEY not found in environment');
  process.exit(1);
}

// Default Tracking Number - REPLACE THIS with one that exists in your local DB
const TRACKING_NUMBER = process.argv[2] || 'TRK123456789'; 

console.log(`Testing Webhook for Tracking Number: ${TRACKING_NUMBER}`);
console.log(`Using API Key: ${API_KEY.slice(0, 5)}...`);

async function sendWebhook() {
  const timestamp = Date.now().toString();
  
  // 1. Create Payload
  const payload = {
    data: {
      trackNo: TRACKING_NUMBER,
      transitStatus: 'DELIVERED', // Simulate a change
      transitSubStatus: 'DELIVERED_001',
      estimatedDelivery: '2025-01-05',
      localLogisticsInfo: {
        courierCode: 'fedex',
        trackingDetails: [
           {
             eventTime: new Date().toISOString(),
             eventDetail: 'Delivered to front porch',
             transitSubStatus: 'DELIVERED',
             address: 'New York, NY'
           }
        ]
      }
    },
    // The signature wrapper
    verify: {
      timestamp: timestamp,
      signature: '' // To be calculated
    }
  };

  // 2. Generate Signature
  // Track123 Logic: HMAC-SHA256(timestamp, apiKey) -> hex
  const hmac = crypto.createHmac('sha256', API_KEY!);
  hmac.update(timestamp);
  const signature = hmac.digest('hex');

  payload.verify.signature = signature;

  console.log('Payload prepared. Sending...');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(`Response Status: ${response.status}`);
    console.log('Response Body:', data);

  } catch (error) {
    console.error('Request Failed:', error);
  }
}

sendWebhook();
