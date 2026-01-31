/** @format */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ShipmentService } from '@/lib/services/shipment-service';
import { NotificationService } from '@/lib/services/notification-service';
import { revalidatePath, unstable_cache } from 'next/cache';
import { z } from 'zod';
import { getUserTenantIds, ensureStaffAccess } from '@/lib/utils/permissions';
import { ShipmentTableFilters } from '@/lib/types';
import { cookies } from 'next/headers';
import {
  ActionResponse,
  successResponse,
  errorResponse,
} from '@/lib/api-response';
import { isAdmin, hasRole } from '@/lib/utils/permissions'; // Keep these if used as values

// Types
export interface GetShipmentsParams {
  page: number;
  pageSize: number;
  filters?: ShipmentTableFilters;
  sortBy?: { id: string; desc: boolean };
}

/**
 * Helper to resolve which tenant IDs to query based on user role, cookies, and filters.
 * Returns `undefined` if "All Tenants" (Admin only), or an array of IDs.
 */
async function resolveEffectiveTenants(
  isUserAdmin: boolean,
  userTenantIds: string[],
  filterTenant?: string | null,
): Promise<string[] | undefined> {
  // 0. Explicit 'all' override: User wants to see EVERYTHING, ignoring context cookie
  if (isUserAdmin && filterTenant === 'all') {
    return undefined;
  }

  // 1. If explicit filter is passed (e.g. from dropdown)
  if (filterTenant && filterTenant !== 'all') {
    // Validate access: Admin can see any, Staff only their own
    if (isUserAdmin || userTenantIds.includes(filterTenant)) {
      return [filterTenant];
    }
    return []; // Unauthorized access attempt returns empty
  }

  // 2. If no filter, check Admin Context Cookie
  if (isUserAdmin) {
    const cookieStore = await cookies();
    const contextTenantId = cookieStore.get('admin_tenant_context')?.value;

    // If context is set (and not 'all'), limit to that context
    if (contextTenantId && contextTenantId !== 'all') {
      return [contextTenantId];
    }
    // Otherwise, Admin sees ALL (undefined)
    return undefined;
  }

  // 3. Staff fallback: Limit to their assigned tenants
  return userTenantIds.length > 0 ? userTenantIds : [];
}

/**
 * Server Action: Fetch Shipments (Cached & Typed)
 */
export async function getShipments(
  params: GetShipmentsParams,
): Promise<ActionResponse<any>> {
  try {
    const { isUserAdmin } = await ensureStaffAccess();
    const userTenantIds = await getUserTenantIds();

    const effectiveTenantIds = await resolveEffectiveTenants(
      isUserAdmin,
      userTenantIds,
      params.filters?.tenant,
    );

    // Cache Key Generator
    const generateCacheKey = () => {
      const parts = [
        `page:${params.page}`,
        `size:${params.pageSize}`,
        `status:${params.filters?.status || 'all'}`,
        `search:${params.filters?.search || ''}`,
        `provider:${params.filters?.provider || ''}`,
        `tenant:${effectiveTenantIds ? effectiveTenantIds.sort().join(',') : 'ALL'}`,
        `archived:${params.filters?.archived || 'false'}`,
        `sort:${params.sortBy?.id}:${params.sortBy?.desc}`,
      ];
      return parts.join('|');
    };

    const cacheKey = generateCacheKey();

    const getCachedShipments = unstable_cache(
      async () => {
        const service = new ShipmentService(createAdminClient());
        return await service.getShipments({
          ...params,
          filters: {
            ...params.filters,
            tenantIds: effectiveTenantIds,
          },
          sortBy: params.sortBy
            ? {
                field: params.sortBy.id,
                direction: params.sortBy.desc ? 'desc' : 'asc',
              }
            : undefined,
        });
      },
      [`shipments-list-${cacheKey}`],
      {
        revalidate: 60, // 1 minute
        tags: ['shipments'],
      },
    );

    const result = await getCachedShipments();

    return successResponse(result);
  } catch (error: any) {
    console.error(
      'getShipments Error:',
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    );
    return errorResponse(error);
  }
}

/**
 * Server Action: Fetch Stats (Cached)
 */
export async function getShipmentStats(
  tenantFilter?: string,
): Promise<ActionResponse<any>> {
  try {
    const { isUserAdmin } = await ensureStaffAccess();
    const userTenantIds = await getUserTenantIds();

    const effectiveTenantIds = await resolveEffectiveTenants(
      isUserAdmin,
      userTenantIds,
      tenantFilter,
    );

    const tenantKey = effectiveTenantIds
      ? effectiveTenantIds.sort().join('-')
      : 'ALL';

    const getCachedStats = unstable_cache(
      async () => {
        const service = new ShipmentService(createAdminClient());
        return await service.getStats({ tenantIds: effectiveTenantIds });
      },
      [`shipment-stats-${tenantKey}`],
      {
        revalidate: 60,
        tags: ['shipments', `shipments-${tenantKey}`],
      },
    );

    const stats = await getCachedStats();
    return successResponse(stats);
  } catch (error: any) {
    return errorResponse(error);
  }
}

// --- Legacy / Other Actions Below (Preserved but optimized where possible) ---

export async function createShipmentAction(values: {
  tracking_number: string;
  carrier_code?: string;
  amount?: number;
  userId?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  tenantId?: string;
  is_archived?: boolean;
}): Promise<ActionResponse<any>> {
  try {
    await ensureStaffAccess();
    const isAdminUser = await isAdmin();
    let tenantId = values.tenantId;

    if (tenantId && !isAdminUser) {
      tenantId = undefined;
    }

    if (!tenantId) {
      const tenantIds = await getUserTenantIds();
      tenantId = tenantIds.length > 0 ? tenantIds[0] : undefined;
    }

    if (!tenantId && isAdminUser) {
      const supabase = await createClient();
      const { data: firstTenant } = await supabase
        .from('tenants')
        .select('id')
        .limit(1)
        .single();
      if (firstTenant) tenantId = firstTenant.id;
    }

    if (!tenantId) {
      return errorResponse({
        message: 'No tenant found for shipment creation',
      });
    }

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
      isArchived: values.is_archived,
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

export async function archiveShipmentAction(
  shipmentId: string,
): Promise<ActionResponse<any>> {
  try {
    await ensureStaffAccess();
    const service = new ShipmentService(createAdminClient());
    await service.archiveShipment(shipmentId);
    revalidatePath('/shipments');
    return successResponse(true);
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function unarchiveShipmentAction(
  shipmentId: string,
): Promise<ActionResponse<any>> {
  try {
    await ensureStaffAccess();
    const service = new ShipmentService(createAdminClient());
    await service.unarchiveShipment(shipmentId);
    revalidatePath('/shipments');
    return successResponse(true);
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
    await service.updateShipment(shipmentId, { carrier_code: carrierCode });
    const result = await service.syncShipment(shipmentId, carrierCode);
    revalidatePath('/shipments');
    return successResponse(result);
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
    const formatted = carriers.map((c) => ({
      ...c,
      label: `${c.name} (${c.code})`,
    }));
    return successResponse(formatted);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function searchUsers(query: string) {
  try {
    await ensureStaffAccess();
    if (!query || query.trim().length < 2) return { success: true, data: [] };

    const { isUserAdmin } = await ensureStaffAccess();
    const tenantIds = await getUserTenantIds();

    const adminClient = createAdminClient();
    const {
      data: { users },
      error,
    } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) throw error;

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
    const lowerQ = query.toLowerCase().trim();

    const matches = users
      .filter((u) => validUserIds.has(u.id))
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

export async function sendShipmentNotificationAction(
  shipmentId: string,
): Promise<ActionResponse<any>> {
  try {
    const { isUserAdmin } = await ensureStaffAccess();
    const service = new ShipmentService(createAdminClient());

    // We need to fetch the shipment first to get details
    // Currently ShipmentService doesn't have a simple getById that returns everything needed for notification?
    // Actually getShipments returns arrays.
    // Let's use internal client in ShipmentService or just use Supabase direct for specific fetch if needed.
    // Or add getShipmentById to Service?
    // Existing code often uses getShipments with filters.

    const adminClient = createAdminClient();
    const { data: shipment, error } = await adminClient
      .from('shipments')
      .select(
        `
            *,
            carrier:carriers(name_en, name_cn)
        `,
      )
      .eq('id', shipmentId)
      .single();

    if (error || !shipment) {
      return errorResponse({ message: 'Shipment not found' });
    }

    const notificationService = new NotificationService(adminClient);
    const result = await notificationService.sendNotifications({
      shipmentId: shipment.id,
      tenantId: shipment.tenant_id,
      status: shipment.status,
      recipientEmail: shipment.customer_details?.email,
      recipientPhone: shipment.customer_details?.phone,
      recipientName: shipment.customer_details?.name,
      trackingCode: shipment.carrier_tracking_code,
      referenceCode: shipment.white_label_code,
      location: shipment.latest_location,
      updatedAt: new Date().toISOString(), // Use current time for manual trigger
      carrier: shipment.carrier?.name_en || shipment.carrier_id,
      tenantName: 'Gajan Logistics', // TODO: Fetch tenant name if dynamic
    });

    return successResponse({
      sent: true,
      results: result,
      message: 'Notification trigger output: ' + JSON.stringify(result),
    });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function exportShipmentsAction(
  filters: { status?: string; provider?: string; search?: string } = {},
): Promise<ActionResponse<any>> {
  try {
    const { isUserAdmin } = await ensureStaffAccess();
    const userTenantIds = await getUserTenantIds();
    const effectiveTenantIds = await resolveEffectiveTenants(
      isUserAdmin,
      userTenantIds,
    );

    const service = new ShipmentService(createAdminClient());
    const result = await service.getShipments({
      page: 1,
      pageSize: -1,
      filters: { ...filters, tenantIds: effectiveTenantIds },
      sortBy: { field: 'created_at', direction: 'desc' },
    });

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
    const { isUserAdmin } = await ensureStaffAccess();
    const userTenantIds = await getUserTenantIds();
    const effectiveTenantIds = await resolveEffectiveTenants(
      isUserAdmin,
      userTenantIds,
    );

    const tenantKey = effectiveTenantIds
      ? effectiveTenantIds.sort().join('-')
      : 'ALL';
    const getCachedTrends = unstable_cache(
      async () => {
        const service = new ShipmentService(createAdminClient());
        return await service.getShipmentTrends(days);
      },
      [`shipment-trends-${tenantKey}-${days}`],
      {
        revalidate: 3600,
        tags: ['shipments', `shipments-${tenantKey}`],
      },
    );

    const trends = await getCachedTrends();
    return successResponse(trends);
  } catch (error: any) {
    return errorResponse(error);
  }
}
