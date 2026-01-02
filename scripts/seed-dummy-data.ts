
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

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
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
    console.log('Seeding dummy data...');

    // 0. Get/Create Tenant
    let tenantId = null;
    const { data: tenants, error: fetchErr } = await supabase.from('tenants').select('id').limit(1);
    if (!fetchErr && tenants && tenants.length > 0) {
        tenantId = tenants[0].id;
        console.log('Using existing tenant:', tenantId);
    } else {
        console.log('No tenant found. Creating one...');
        // Try to insert with common fields
        const { data: newTenant, error: createErr } = await supabase
            .from('tenants')
            .insert({ name: 'Default Team', slug: 'default-team' }) // Guessing slug is needed
            .select()
            .single();
        
        if (createErr) {
            console.error('Error creating tenant:', createErr);
            // If error is about slug column not existing, try without slug? 
            // Or if specific validaiton failed?
            // Fallback: try minimal
             if (createErr.message.includes('slug')) {
                 const { data: simpleTenant, error: simpleErr } = await supabase
                    .from('tenants')
                    .insert({ name: 'Default Team' })
                    .select()
                    .single();
                 if (simpleErr) {
                     console.error('Fallback tenant creation failed:', simpleErr);
                     return; 
                 }
                 tenantId = simpleTenant.id;
             } else {
                 return;
             }
        } else {
            tenantId = newTenant.id;
        }
        console.log('Created new tenant:', tenantId);
    }

    if (!tenantId) {
        console.error("Could not obtain tenant ID. Aborting.");
        return;
    }

    // 1. Create a dummy shipment (Delivered)
    const s1Template = {
        white_label_code: 'WL-TEST-001',
        carrier_tracking_code: 'TRK123456789',
        carrier_id: 'dhl',
        provider: 'track123',
        status: 'delivered',
        tenant_id: tenantId,
        customer_details: {
            name: "John Doe",
            email: "john@example.com",
            phone: "+1234567890"
        },
        invoice_details: {
            amount: 150.00,
            currency: "USD"
        }
    };

    // Check strict existence
    let { data: s1 } = await supabase
        .from('shipments')
        .select('id')
        .eq('provider', s1Template.provider)
        .eq('carrier_tracking_code', s1Template.carrier_tracking_code)
        .single();

    if (!s1) {
        const { data: created, error } = await supabase
            .from('shipments')
            .insert(s1Template)
            .select()
            .single();
        if (error) console.error('Error creating shipment 1:', error);
        else {
            console.log('Created Shipment 1:', created.id);
            s1 = created;
        }
    } else {
        console.log('Shipment 1 already exists:', s1.id);
    }

    if (s1) {
        // Events for Shipment 1
        const events1 = [
            {
                shipment_id: s1.id,
                status: 'created',
                description: 'Shipment information received',
                location: 'New York, NY',
                occurred_at: new Date(Date.now() - 86400000 * 3).toISOString()
            },
            {
                shipment_id: s1.id,
                status: 'transit',
                description: 'Departed facility',
                location: 'New York, NY',
                occurred_at: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
                shipment_id: s1.id,
                status: 'delivered',
                description: 'Delivered to recipient',
                location: 'Los Angeles, CA',
                occurred_at: new Date().toISOString()
            }
        ];
        
        // Similarly for events, check existence or just insert (ignoring duplicates might fail without constraint)
        // We'll iterate and check to be safe
        for (const evt of events1) {
            const { data: existingEvt } = await supabase
                .from('tracking_events')
                .select('id')
                .eq('shipment_id', evt.shipment_id)
                .eq('status', evt.status)
                .eq('occurred_at', evt.occurred_at)
                .single();
            
            if (!existingEvt) {
                const { error: ee1 } = await supabase.from('tracking_events').insert(evt);
                if (ee1) console.error('Error creating event:', ee1);
            }
        }
    }

    // 2. Create a dummy shipment (In Transit)
    const s2Template = {
        white_label_code: 'WL-TEST-002',
        carrier_tracking_code: 'TRK987654321',
        carrier_id: 'fedex',
        provider: 'track123',
        status: 'transit',
        tenant_id: tenantId,
        customer_details: {
            name: "Jane Smith",
            email: "jane@example.com",
            phone: "+0987654321"
        }
    };

    let { data: s2 } = await supabase
        .from('shipments')
        .select('id')
        .eq('provider', s2Template.provider)
        .eq('carrier_tracking_code', s2Template.carrier_tracking_code)
        .single();
    
    if (!s2) {
        const { data: created, error } = await supabase
            .from('shipments')
            .insert(s2Template)
            .select()
            .single();
        if (error) console.error('Error creating shipment 2:', error);
        else {
             console.log('Created Shipment 2:', created.id);
             s2 = created;
        }
    } else {
        console.log('Shipment 2 already exists:', s2.id);
    }

    if (s2) {
         // Events for Shipment 2
         const events2 = [
            {
                shipment_id: s2.id,
                status: 'created',
                description: 'Shipment created',
                location: 'Chicago, IL',
                occurred_at: new Date(Date.now() - 3600000 * 5).toISOString()
            }
        ];
        
        for (const evt of events2) {
            const { data: existingEvt } = await supabase
                .from('tracking_events')
                .select('id')
                .eq('shipment_id', evt.shipment_id)
                .eq('status', evt.status)
                .eq('occurred_at', evt.occurred_at)
                .single();
            
            if (!existingEvt) {
                const { error: ee2 } = await supabase.from('tracking_events').insert(evt);
                if (ee2) console.error('Error creating event:', ee2);
            }
        }
    }

    console.log('Seed Complete!');
}

run();
