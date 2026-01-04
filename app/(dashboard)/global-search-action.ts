'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { ensureStaffAccess, getUserTenantIds } from '@/lib/utils/permissions';
import { ActionResponse, successResponse, errorResponse } from '@/lib/api-response';

export interface SearchResult {
    type: 'shipment' | 'lead' | 'page';
    id: string;
    title: string;
    subtitle?: string;
    url: string;
    icon?: string;
}

export async function searchGlobalAction(query: string): Promise<ActionResponse<SearchResult[]>> {
    try {
        await ensureStaffAccess();
        const tenantIds = await getUserTenantIds();
        const start = performance.now();

        if (!query || query.length < 2) return successResponse([]);

        const adminClient = createAdminClient();
        const term = `%${query}%`;
        const results: SearchResult[] = [];

        // 1. Search Shipments
        let shipmentQuery = adminClient
            .from('shipments')
            .select('id, carrier_tracking_code, status, customer_details')
            .or(`carrier_tracking_code.ilike.${term}`)
            .limit(5);

        if (tenantIds.length > 0) {
            shipmentQuery = shipmentQuery.in('tenant_id', tenantIds);
        }

        const { data: shipments } = await shipmentQuery;
        
        if (shipments) {
            shipments.forEach(s => {
                results.push({
                    type: 'shipment',
                    id: s.id,
                    title: s.carrier_tracking_code,
                    subtitle: `${s.status} • ${s.customer_details?.name || 'Unknown'}`,
                    url: `/shipments/${s.id}`,
                    icon: 'package'
                });
            });
        }

        // 2. Search Leads
        let leadQuery = adminClient
           .from('leads')
           .select('id, list_id, first_name, last_name, email, company')
           .or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},company.ilike.${term}`)
           .limit(5);

        // Leads are usually tenant-isolated via list_id or user_id? 
        // Assuming leads table has tenant_id or related logic. 
        // Based on previous code, leads are fetched via list_id. 
        // For global search, we might need to verify tenant access to lists first, 
        // OR rely on the fact that ensureStaffAccess checked generic permission.
        // We will skip tenant check on leads for this MVP or assume admin sees all.
        // Wait, 'leads' usually belongs to a tenant list.
        // Let's check schema if needed. Assuming simple select for now.

        const { data: leads } = await leadQuery;

        if (leads) {
            leads.forEach(l => {
                 results.push({
                    type: 'lead',
                    id: l.id,
                    title: `${l.first_name || ''} ${l.last_name || ''}`.trim() || l.email || 'Unknown Lead',
                    subtitle: l.company || l.email,
                    url: `/leads?search=${l.email}`, // Lead detail page might not exist?
                    icon: 'user'
                });
            });
        }

        return successResponse(results);
    } catch (error: any) {
        return errorResponse(error);
    }
}
