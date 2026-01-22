/** @format */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ShipmentService } from '@/lib/services/shipment-service'; // New location
import { revalidatePath } from 'next/cache';
import {
  hasRole,
  isAdmin,
  getUserTenantIds,
  ensureStaffAccess,
} from '@/lib/utils/permissions';
import { ShipmentTableFilters } from '@/lib/types';
import { cookies } from 'next/headers';
import {
  ActionResponse,
  successResponse,
  errorResponse,
} from '@/lib/api-response';

export async function createShipmentAction(values: {
  tracking_number: string;
  carrier_code?: string;
  amount?: number;
  userId?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  tenantId?: string;
}): Promise<ActionResponse<any>> {
  try {
    await ensureStaffAccess();
    const isAdminUser = await isAdmin();
    let tenantId = values.tenantId;

    // Only admins can override tenant
    if (tenantId && !isAdminUser) {
      tenantId = undefined;
    }

    if (!tenantId) {
      const tenantIds = await getUserTenantIds();
      tenantId = tenantIds.length > 0 ? tenantIds[0] : undefined;
    }

    if (!tenantId && isAdminUser) {
      // Fallback for Global Admin: Use the first available tenant in the system or a default one
      // This ensures the shipment is created under *some* tenant rather than crashing
      const supabase = await createClient(); // Use regular client to query
      const { data: firstTenant } = await supabase
        .from('tenants')
        .select('id')
        .limit(1)
        .single();
      if (firstTenant) {
        tenantId = firstTenant.id;
      }
    }

    if (!tenantId) {
      return errorResponse({
        message: 'No tenant found for shipment creation',
      });
    }

    // Use Admin Client to bypass RLS for creation
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

    revalidatePath('/shipments');
    return successResponse(shipment);
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function syncShipmentAction(
  shipmentId: string,
): Promise<ActionResponse<any>> {
  try {
    await ensureStaffAccess();
    const service = new ShipmentService(createAdminClient());
    const result = await service.syncShipment(shipmentId);

    revalidatePath('/shipments');
    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function bulkDeleteShipmentsAction(
  shipmentIds: string[],
): Promise<ActionResponse<any>> {
  try {
    await ensureStaffAccess();
    const service = new ShipmentService(createAdminClient());
    const result = await service.bulkDeleteShipments(shipmentIds);

    revalidatePath('/shipments');
    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function updateShipmentCarrierAction(
  shipmentId: string,
  carrierCode: string,
): Promise<ActionResponse<any>> {
  try {
    await ensureStaffAccess();
    const service = new ShipmentService(createAdminClient());

    // Update and Sync
    await service.updateShipment(shipmentId, { carrier_code: carrierCode });
    const result = await service.syncShipment(shipmentId, carrierCode);

    revalidatePath('/shipments');
    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function getShipments(
  page: number = 1,
  pageSize: number = 10,
  filters: ShipmentTableFilters = {},
  sortBy?: { id: string; desc: boolean },
): Promise<ActionResponse<any>> {
  try {
    const { isUserAdmin } = await ensureStaffAccess();
    const userTenantIds = await getUserTenantIds();

    let effectiveTenantIds: string[] | undefined = isUserAdmin
      ? undefined
      : userTenantIds;

    // 1. Check explicit filter from Toolbar
    if (filters.tenant && filters.tenant !== 'all') {
      if (isUserAdmin || userTenantIds.includes(filters.tenant)) {
        effectiveTenantIds = [filters.tenant];
      } else {
        effectiveTenantIds = []; // Unauthorized tenant request
      }
    }
    // 2. Fallback to Admin Context logic (if no specific filter)
    else if (isUserAdmin) {
      const cookieStore = await cookies();
      const contextTenantId = cookieStore.get('admin_tenant_context')?.value;
      if (contextTenantId) {
        effectiveTenantIds = [contextTenantId];
      }
      // else leave undefined (all tenants)
    }

    const service = new ShipmentService(createAdminClient());

    const result = await service.getShipments({
      page,
      pageSize,
      filters: {
        ...filters,
        tenantIds:
          effectiveTenantIds && effectiveTenantIds.length > 0
            ? effectiveTenantIds
            : undefined,
      },
      sortBy: sortBy
        ? { field: sortBy.id, direction: sortBy.desc ? 'desc' : 'asc' }
        : undefined,
    });

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}

import { unstable_cache } from 'next/cache';

// ... existing imports

export async function getShipmentStats(): Promise<ActionResponse<any>> {
  try {
    await ensureStaffAccess();
    const isUserAdmin = await isAdmin();
    let tenantIds = await getUserTenantIds();

    if (isUserAdmin) {
      const cookieStore = await cookies();
      const contextTenantId = cookieStore.get('admin_tenant_context')?.value;
      if (contextTenantId) tenantIds = [contextTenantId];
      else tenantIds = [];
    }

    // Create a unique cache tag based on tenants
    const tenantKey = tenantIds.sort().join('-');

    const getCachedStats = unstable_cache(
      async () => {
        const service = new ShipmentService(createAdminClient());
        return await service.getStats({ tenantIds });
      },
      [`shipment-stats-${tenantKey}`],
      {
        revalidate: 60, // Cache for 60 seconds
        tags: ['shipments', `shipments-${tenantKey}`],
      },
    );

    const stats = await getCachedStats();
    return successResponse(stats);
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function searchCarriers(
  query: string = '',
): Promise<ActionResponse<any>> {
  try {
    await ensureStaffAccess();
    const service = new ShipmentService(createAdminClient());
    const carriers = await service.searchCarriers(query);

    // Map to combobox format here or in service?
    // Service returns array of objects. Actions usually format for UI?
    // Service returns { code, name, logo_url }.
    // UI expects { label, value, ... }

    const formatted = carriers.map((c) => ({
      ...c,
      label: `${c.name} (${c.code})`,
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
    const {
      data: { users },
      error,
    } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 });
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

    const validUserIds = new Set(validRoles?.map((r) => r.user_id) || []);

    // 3. Filter and Search
    const lowerQ = query.toLowerCase().trim();
    const matches = users
      .filter((u) => validUserIds.has(u.id)) // Filter by Role & Tenant
      .map((u) => {
        const email = u.email?.toLowerCase() || '';
        const name = (
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          ''
        ).toLowerCase();
        let score = 0;
        if (email.includes(lowerQ)) score += 50;
        if (name.includes(lowerQ)) score += 50;
        return { user: u, score };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((m) => ({
        id: m.user.id,
        email: m.user.email,
        name: m.user.user_metadata?.full_name || m.user.email,
        label: `${m.user.user_metadata?.full_name || m.user.email} (${m.user.email})`,
      }));

    return successResponse(matches);
  } catch (error: any) {
    return errorResponse(error);
  }
}

// ... (existing exports)

export async function sendShipmentNotificationAction(
  shipmentId: string,
): Promise<ActionResponse<any>> {
  try {
    await ensureStaffAccess();
    const service = new ShipmentService(createAdminClient());

    // 1. Get Shipment
    const { data: shipment, error } = await createAdminClient()
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (error || !shipment) throw new Error('Shipment not found');

    // 2. Trigger Notification
    const { NotificationService } = await import('@/lib/notifications/service');
    const notifier = new NotificationService();
    await notifier.notifyStatusChange({
      shipmentId: shipment.id,
      trackingCode: shipment.carrier_tracking_code,
      status: shipment.status,
      oldStatus: undefined, // Treat as force send
      customerName: shipment.customer_details?.name,
      customerEmail: shipment.customer_details?.email,
      customerPhone: shipment.customer_details?.phone,
      location: shipment.latest_location,
    });

    return successResponse({ sent: true });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function exportShipmentsAction(
  // ...
  filters: { status?: string; provider?: string; search?: string } = {},
): Promise<ActionResponse<any>> {
  try {
    const { isUserAdmin } = await ensureStaffAccess();
    let tenantIds = await getUserTenantIds();

    if (isUserAdmin) {
      const cookieStore = await cookies();
      const contextTenantId = cookieStore.get('admin_tenant_context')?.value;
      if (contextTenantId) tenantIds = [contextTenantId];
      else tenantIds = [];
    }

    const service = new ShipmentService(createAdminClient());

    const result = await service.getShipments({
      page: 1,
      pageSize: -1, // Fetch All
      filters: {
        ...filters,
        tenantIds: tenantIds.length > 0 ? tenantIds : undefined,
      },
      sortBy: { field: 'created_at', direction: 'desc' },
    });

    // Flatten data for CSV
    const flatData = result.data.map((s: any) => ({
      'Tracking ID': s.carrier_tracking_code,
      Status: s.status,
      Carrier: s.carrier?.name_en || s.carrier_id,
      'Created Date': new Date(s.created_at).toLocaleDateString(),
      'Customer Name': s.customer_details?.name || 'N/A',
      'Customer Email': s.customer_details?.email || 'N/A',
      Location: s.latest_location || '-',
      'Est. Delivery': s.estimated_delivery
        ? new Date(s.estimated_delivery).toLocaleDateString()
        : '-',
    }));

    return successResponse(flatData);
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function getShipmentTrendsAction(
  days: number = 30,
): Promise<ActionResponse<any>> {
  try {
    await ensureStaffAccess();
    const isUserAdmin = await isAdmin();
    let tenantIds = await getUserTenantIds();

    if (isUserAdmin) {
      const cookieStore = await cookies();
      const contextTenantId = cookieStore.get('admin_tenant_context')?.value;
      if (contextTenantId) tenantIds = [contextTenantId];
      else tenantIds = [];
    }
    const tenantKey = tenantIds.sort().join('-');

    const getCachedTrends = unstable_cache(
      async () => {
        const service = new ShipmentService(createAdminClient());
        return await service.getShipmentTrends(days);
      },
      [`shipment-trends-${tenantKey}-${days}`],
      {
        revalidate: 3600, // Cache for 1 hour
        tags: ['shipments', `shipments-${tenantKey}`],
      },
    );

    const trends = await getCachedTrends();
    return successResponse(trends);
  } catch (error: any) {
    return errorResponse(error);
  }
}
