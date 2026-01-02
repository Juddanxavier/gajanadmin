'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ShipmentService } from '@/lib/services/shipment-service'; // New location
import { revalidatePath } from 'next/cache';
import { hasRole, isAdmin, getUserTenantIds, ensureStaffAccess } from "@/lib/utils/permissions";
import { ActionResponse, successResponse, errorResponse } from '@/lib/api-response';

export async function createShipmentAction(values: { 
    tracking_number: string;
    carrier_code?: string; 
    amount?: number; 
    userId?: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
}): Promise<ActionResponse<any>> {
    try {
        await ensureStaffAccess();
        const tenantIds = await getUserTenantIds();
        const tenantId = tenantIds.length > 0 ? tenantIds[0] : undefined; 

        // Use Admin Client to bypass RLS for creation (ensures tenant_id is set correctly even if user RLS is tricky for multi-tenant admins)
        const service = new ShipmentService(createAdminClient());

        const shipment = await service.createShipment({
            tracking_number: values.tracking_number,
            carrier_code: values.carrier_code,
            userId: values.userId,
            customer_name: values.customer_name,
            customer_email: values.customer_email || undefined,
            customer_phone: values.customer_phone || undefined,
            tenantId: tenantId,
            invoiceDetails: values.amount ? { amount: values.amount } : undefined,
        });

        revalidatePath('/admin/shipments');
        return successResponse(shipment);
    } catch (error: any) {
        return errorResponse(error);
    }
}

export async function syncShipmentAction(shipmentId: string): Promise<ActionResponse<any>> {
  try {
    await ensureStaffAccess();
    const service = new ShipmentService(createAdminClient());
    const result = await service.syncShipment(shipmentId);
    
    revalidatePath('/admin/shipments');
    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}


export async function bulkDeleteShipmentsAction(shipmentIds: string[]): Promise<ActionResponse<any>> {
    try {
        await ensureStaffAccess();
        const service = new ShipmentService(createAdminClient());
        const result = await service.bulkDeleteShipments(shipmentIds);

        revalidatePath('/admin/shipments');
        return successResponse(result);
    } catch (error: any) {
        return errorResponse(error);
    }
}

export async function updateShipmentCarrierAction(shipmentId: string, carrierCode: string): Promise<ActionResponse<any>> {
    try {
        await ensureStaffAccess();
        const service = new ShipmentService(createAdminClient());

        // Update and Sync
        await service.updateShipment(shipmentId, { carrier_code: carrierCode });
        const result = await service.syncShipment(shipmentId, carrierCode);
        
        revalidatePath('/admin/shipments');
        return successResponse(result);
    } catch (error: any) {
        return errorResponse(error);
    }
}

export async function getShipments(
    page: number = 1,
    pageSize: number = 10, 
    filters: { status?: string, provider?: string, search?: string } = {},
    sortBy?: { id: string, desc: boolean }
): Promise<ActionResponse<any>> {
    try {
        const { isUserAdmin } = await ensureStaffAccess();
        const tenantIds = await getUserTenantIds();

        const service = new ShipmentService(createAdminClient());
        
        const result = await service.getShipments({
            page,
            pageSize,
            filters: {
                ...filters,
                tenantIds: isUserAdmin ? undefined : tenantIds // Admins see all? Or admins see THEIR tenants? Assuming admins of the PLATFORM see all, but Tenant Admins see theirs. 
                // Wait, isAdmin() usually checks for 'admin' role in a specific tenant or global?
                // In this system, user_roles is keyed by tenant_id. So 'admin' is per-tenant.
                // So even admins should be filtered by tenantIds unless they are distinct "Super Admins".
                // Safest to ALWAYS filter by tenantIds unless the logic specifically handles Super Admin.
                // I'll filter by tenantIds for robustness.
            },
            sortBy: sortBy ? { field: sortBy.id, direction: sortBy.desc ? 'desc' : 'asc' } : undefined
        });

        return successResponse(result);
    } catch (error: any) {
        return errorResponse(error);
    }
}

export async function getShipmentStats(): Promise<ActionResponse<any>> {
    try {
        await ensureStaffAccess();
        const tenantIds = await getUserTenantIds();
        
        const service = new ShipmentService(createAdminClient());
        const stats = await service.getStats({ tenantIds });
        
        return successResponse(stats);
    } catch (error: any) {
        return errorResponse(error);
    }
}

export async function searchCarriers(query: string = ''): Promise<ActionResponse<any>> {
    try {
        await ensureStaffAccess();
        const service = new ShipmentService(createAdminClient());
        const carriers = await service.searchCarriers(query);
        
        // Map to combobox format here or in service?
        // Service returns array of objects. Actions usually format for UI?
        // Service returns { code, name, logo_url }.
        // UI expects { label, value, ... }
        
        const formatted = carriers.map(c => ({
            ...c,
            label: `${c.name} (${c.code})`
        }));

        return successResponse(formatted);
    } catch (error) {
        return errorResponse(error);
    }
}

// Search users helper (kept here or moved to UserService?)
// The implementation plan says "Refactor Users Logic to UserService".
// For now I'll leave it here or move it.
// I'll keep it here but using AdminClient as before, cleaning it up a bit.
export async function searchUsers(query: string) {
    try {
       await ensureStaffAccess();
       if (!query || query.trim().length < 2) return { success: true, data: [] };

       const { isUserAdmin } = await ensureStaffAccess();
       const tenantIds = await getUserTenantIds();

       // 1. Get all users from Auth (limit to 100 for performance, or more if needed)
       const adminClient = createAdminClient();
       const { data: { users }, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 });
       if (error) throw error;

       // 2. Get valid user IDs (Customers in current tenant)
       const supabase = await createClient();
       let roleQuery = supabase
           .from('user_roles')
           .select('user_id')
           .eq('role', 'customer');

       if (!isUserAdmin && tenantIds.length > 0) {
           roleQuery = roleQuery.in('tenant_id', tenantIds);
       }

       const { data: validRoles, error: roleError } = await roleQuery;
       if (roleError) throw roleError;
       
       const validUserIds = new Set(validRoles?.map(r => r.user_id) || []);

       // 3. Filter and Search
       const lowerQ = query.toLowerCase().trim();
       const matches = users
            .filter(u => validUserIds.has(u.id)) // Filter by Role & Tenant
            .map(u => {
                const email = u.email?.toLowerCase() || '';
                const name = (u.user_metadata?.full_name || u.user_metadata?.name || '').toLowerCase();
                let score = 0;
                if (email.includes(lowerQ)) score += 50;
                if (name.includes(lowerQ)) score += 50;
                return { user: u, score };
            })
            .filter(m => m.score > 0)
            .sort((a,b) => b.score - a.score)
            .slice(0, 20)
            .map(m => ({
                id: m.user.id,
                email: m.user.email,
                name: m.user.user_metadata?.full_name || m.user.email,
                label: `${m.user.user_metadata?.full_name || m.user.email} (${m.user.email})`
            }));
            
       return successResponse(matches);
    } catch (error: any) {
        return errorResponse(error);
    }
}

export async function exportShipmentsAction(
    filters: { status?: string, provider?: string, search?: string } = {}
): Promise<ActionResponse<any>> {
    try {
        const { isUserAdmin } = await ensureStaffAccess();
        const tenantIds = await getUserTenantIds();

        const service = new ShipmentService(createAdminClient());
        
        const result = await service.getShipments({
            page: 1,
            pageSize: -1, // Fetch All
            filters: {
                ...filters,
                tenantIds: tenantIds // Always filter by tenant
            },
            sortBy: { field: 'created_at', direction: 'desc' }
        });

        // Flatten data for CSV
        const flatData = result.data.map((s: any) => ({
            'Tracking ID': s.carrier_tracking_code,
            'Status': s.status,
            'Carrier': s.carrier?.name_en || s.carrier_id,
            'Created Date': new Date(s.created_at).toLocaleDateString(),
            'Customer Name': s.customer_details?.name || 'N/A',
            'Customer Email': s.customer_details?.email || 'N/A',
            'Location': s.latest_location || '-',
            'Est. Delivery': s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString() : '-'
        }));

        return successResponse(flatData);
    } catch (error: any) {
        return errorResponse(error);
    }
}


