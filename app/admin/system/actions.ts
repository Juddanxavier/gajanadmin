'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { ensureStaffAccess, getUserTenantIds } from '@/lib/utils/permissions';
import { ActionResponse, successResponse, errorResponse } from '@/lib/api-response';

export interface SystemHealth {
    database: { status: 'ok' | 'error', latency: number, message?: string };
    cron: { status: 'ok' | 'warning' | 'error', lastSync?: string, message?: string };
    track123: { status: 'configured' | 'missing', message?: string };
    email: { status: 'configured' | 'missing', provider?: string };
}

export async function getSystemHealthAction(): Promise<ActionResponse<SystemHealth>> {
    try {
        await ensureStaffAccess();
        const start = performance.now();
        const adminClient = createAdminClient();

        // 1. Database Check
        const dbStart = performance.now();
        const { error: dbError } = await adminClient.from('shipments').select('id').limit(1);
        const dbLatency = Math.round(performance.now() - dbStart);
        
        const database: SystemHealth['database'] = {
            status: dbError ? 'error' : 'ok',
            latency: dbLatency,
            message: dbError ? dbError.message : 'Connected'
        };

        // 2. Cron Job Check (Last Synced Shipment)
        // Check the most recently synced shipment to see if cron is running
        const { data: lastSynced } = await adminClient
            .from('shipments')
            .select('last_synced_at')
            .not('last_synced_at', 'is', null)
            .order('last_synced_at', { ascending: false })
            .limit(1)
            .single();
        
        let cronStatus: SystemHealth['cron']['status'] = 'ok';
        let cronMessage = 'Active';
        
        if (!lastSynced?.last_synced_at) {
            cronStatus = 'warning';
            cronMessage = 'No sync data found';
        } else {
            const lastSyncDate = new Date(lastSynced.last_synced_at);
            const hoursSince = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);
            if (hoursSince > 24) {
                cronStatus = 'error';
                cronMessage = `Last sync was ${Math.round(hoursSince)} hours ago`;
            } else if (hoursSince > 12) {
                cronStatus = 'warning';
                cronMessage = `Last sync was ${Math.round(hoursSince)} hours ago`;
            }
        }

        // 3. Track123 Check (Settings)
        // We can check if 'settings' table has track123_api_key
        // But settings is per tenant. usage of 'global' settings?
        // Let's check config vars or just assume 'configured' if env var is set.
        // Actually we use settings service now.
        // We'll just check if there is AT LEAST ONE settings row with track123_api_key in DB
        const { data: settings } = await adminClient
            .from('settings')
            .select('track123_api_key')
            .not('track123_api_key', 'is', null)
            .limit(1);

        // 4. Email Provider Check
        // Check for 'notification_providers' table content or just generic env check?
        // Let's check `notification_providers` table.
        const { data: emailProviders } = await adminClient
            .from('notification_providers')
            .select('type, enabled')
            .eq('type', 'email')
            .eq('enabled', true)
            .limit(1);

        return successResponse({
            database,
            cron: {
                status: cronStatus,
                message: cronMessage,
                lastSync: lastSynced?.last_synced_at
            },
            track123: {
                status: (settings && settings.length > 0) ? 'configured' : 'missing',
                message: (settings && settings.length > 0) ? 'API Key found in DB' : 'No API Key found in settings'
            },
            email: {
                status: (emailProviders && emailProviders.length > 0) ? 'configured' : 'missing',
                provider: 'System Email' // Could be specific if we store provider name
            }
        });

    } catch (error: any) {
        return errorResponse(error);
    }
}
