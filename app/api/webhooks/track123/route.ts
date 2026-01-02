import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ShipmentService } from '@/lib/services/shipment-service';
import { getTrack123ApiKey } from '@/lib/settings/service';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, verify } = body;
    const { trackNo } = data || {};
    const { signature, timestamp } = verify || {};

    if (!trackNo || !signature || !timestamp) {
        return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }
    
    // Try to find tenant context
    const url = new URL(req.url);
    let tenantId = url.searchParams.get('tenantId');

    if (!tenantId) {
        // Attempt to find shipment to deduce tenant
        const adminClient = createAdminClient();
        const { data: shipment } = await adminClient
          .from('shipments')
          .select('tenant_id')
          .eq('carrier_tracking_code', trackNo)
          .maybeSingle();
        
        if (shipment) {
            tenantId = shipment.tenant_id;
        }
    }
    
    if (!tenantId) {
        // Cannot verify without tenant context (API Key)
        console.warn(`[Webhook] Could not determine tenant for tracking number: ${trackNo}`);
        return NextResponse.json({ message: 'Tenant context missing' }, { status: 400 });
    }

    // Get API Key for verification
    const apiKey = (await getTrack123ApiKey(tenantId)) || process.env.TRACK123_API_KEY;
    if (!apiKey) {
         console.error(`[Webhook] API Key not configured for tenant: ${tenantId}`);
         return NextResponse.json({ message: 'API Key not configured' }, { status: 500 });
    }

    // Verify Signature
    // Format: HMAC-SHA256(timestamp, apiKey)
    const hmac = crypto.createHmac('sha256', apiKey);
    hmac.update(String(timestamp)); 
    const calculatedSignature = hmac.digest('hex');
    
    // Constant time comparison
    if (!crypto.timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(signature))) {
        console.error(`[Webhook] Signature verification failed. Calculated: ${calculatedSignature}, Received: ${signature}`);
        return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }
    
    // Verify Timestamp freshness (e.g., 5 min window)
    const now = Date.now();
    const ts = parseInt(timestamp);
    if (isNaN(ts) || Math.abs(now - ts) > 5 * 60 * 1000) {
         console.error('[Webhook] Timestamp expired or invalid');
         return NextResponse.json({ message: 'Timestamp expired' }, { status: 401 });
    }
    
    // Process Update
    const shipmentService = new ShipmentService();
    await shipmentService.processWebhook(data, tenantId);
    
    return NextResponse.json({ message: 'OK' });

  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
