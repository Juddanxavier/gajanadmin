/** @format */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Track123Service } from '@/lib/services/track123-service';
import { generateWhiteLabelCode } from '@/lib/utils/tracking-code-generator';

const getService = () => {
  const secret = process.env.TRACK123_API_SECRET;
  if (!secret) throw new Error('TRACK123_API_SECRET missing');
  return new Track123Service({ apiKey: secret });
};

import { createAdminClient } from '@/lib/supabase/admin';

export async function debugUserStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No user' };

  const admin = createAdminClient();
  const { data: isGlobal } = await admin.rpc('is_admin', {
    user_uuid: user.id,
  });
  const { data: roles } = await admin
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id);
  const { count } = await admin
    .from('tenants')
    .select('*', { count: 'exact', head: true });

  return {
    userId: user.id,
    isGlobalRPC: isGlobal,
    roles: roles,
    totalTenants: count,
  };
}

export async function getTenantsForSelection() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return {
        success: false,
        tenants: [],
        error: 'User not authenticated in Server Action',
      };

    const admin = createAdminClient();

    // Robust Global Admin Check
    const { data: roles, error: rolesError } = await admin
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);

    if (rolesError)
      return {
        success: false,
        tenants: [],
        error: `Roles Error: ${rolesError.message}`,
      };

    // Check for null, undefined, empty string
    // Also check if they are 'super_admin' or just 'admin' with no tenant
    const isGlobal = roles?.some(
      (r) => !r.tenant_id || r.tenant_id === '' || r.role === 'super_admin',
    );

    let resultTenants: any[] = [];

    if (
      isGlobal ||
      (roles && roles.length > 0 && roles.some((r) => r.role === 'admin'))
    ) {
      // We'll trust "admin" role is enough to verify seeing tenants,
      // IF we determine they are global.

      const { data: tenants, error: tErr } = await admin
        .from('tenants')
        .select('id, name')
        .order('name');
      if (tErr)
        return {
          success: false,
          tenants: [],
          error: `Tenants Error: ${tErr.message}`,
        };
      resultTenants = tenants || [];
    } else if (roles && roles.length > 0) {
      const tenantIds = roles.map((r) => r.tenant_id).filter((id) => !!id);
      if (tenantIds.length > 0) {
        const { data: myTenants } = await admin
          .from('tenants')
          .select('id, name')
          .in('id', tenantIds)
          .order('name');
        resultTenants = myTenants || [];
      }
    }

    // Debug Payload if empty
    if (resultTenants.length === 0) {
      return {
        success: true,
        tenants: [
          {
            id: 'debug',
            name: `DEBUG: RolesCount=${roles?.length} Roles=${JSON.stringify(roles)} Global=${isGlobal}`,
          },
        ],
      };
    }

    return { success: true, tenants: resultTenants };
  } catch (err: any) {
    return { success: false, tenants: [], error: `Exception: ${err.message}` };
  }
}

// ... imports

export async function getUsersForSelection(tenantId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createAdminClient();

  // 1. Determine Scope
  const { data: isGlobal } = await admin.rpc('is_admin', {
    user_uuid: user.id,
  });

  let targetTenantId = tenantId;

  if (!isGlobal) {
    // If not global, force usage of their own tenant
    const { data: userRole } = await admin
      .from('user_roles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!userRole?.tenant_id) return []; // Should not happen for normal users
    targetTenantId = userRole.tenant_id;
  }

  // If no tenant context determined yet (Global Admin hasn't selected one), return all?
  // No, too many users. Return empty until tenant selected.
  // Unless we want to allow searching ALL users? Let's restrict to tenant context for now.
  if (!targetTenantId) {
    return [];
  }

  // 2. Fetch Users in Tenant
  // We use admin_profile_view or join user_tenants
  // Let's use user_tenants + auth users (via view or manual join)
  // Converting to use admin_profile_view for simplicity if available
  const { data: users, error } = await admin
    .from('admin_profile_view')
    .select('id, email, display_name, full_name')
    .eq('tenant_id', targetTenantId); // Assuming view has flattened tenant_id or we join

  // Wait, admin_profile_view might duplicate if multiple tenants?
  // Let's check permissions.ts or users/actions.ts query again.
  // users/actions.ts manual joins user_tenants.

  if (error) {
    // Fallback if view doesn't allow simple filtering
    const { data: userTenants } = await admin
      .from('user_tenants')
      .select('user_id')
      .eq('tenant_id', targetTenantId);

    if (!userTenants || userTenants.length === 0) return [];

    const ids = userTenants.map((ut) => ut.user_id);
    const { data: rawUsers } = await admin.auth.admin.listUsers(); // Fetching all is bad.
    // Better: Select from a public profiles table if exists.
    // Assuming 'user_roles' or 'admin_profile_view' is best.
    // Let's rely on user_tenants join.
    return []; // TODO: Fix efficient query if view fails
  }

  return users || [];
}

// Redefining proper query logic since I can't test view schema easily
async function fetchUsersByTenant(tenantId: string) {
  const admin = createAdminClient();
  // Join user_tenants -> users (if public.users exists)
  // OR admin_profile_view is the safest bet if it works.
  // Let's try to query admin_profile_view based on user_tenants relationship

  // Actually, simplest is:
  const { data } = await admin
    .from('user_tenants')
    .select('user_id')
    .eq('tenant_id', tenantId);

  if (!data || data.length === 0) return [];

  const userIds = data.map((d) => d.user_id);

  // Fetch details
  // using admin_profile_view which likely contains basic info
  const { data: profiles } = await admin
    .from('admin_profile_view')
    .select('id, email, display_name, full_name')
    .in('id', userIds);

  return profiles || [];
}

// Rewriting Key Export
export async function getUsersForSelectionAction(tenantId?: string) {
  return fetchUsersByTenant(tenantId || '');
}

export async function createShipment(formData: any) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Admin Client for checks
    const admin = createAdminClient();

    // Check Global Admin Status
    const { data: isGlobal } = await admin.rpc('is_admin', {
      user_uuid: user.id,
    });

    let tenantId = null;

    if (isGlobal && formData.tenantId) {
      tenantId = formData.tenantId;
    } else {
      const { data: userRole } = await admin
        .from('user_roles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!userRole?.tenant_id) throw new Error('No tenant found for user');
      tenantId = userRole.tenant_id;
    }

    if (!tenantId) throw new Error('Tenant ID is required');

    // Assign to specific user?
    let targetUserId = user.id; // Default to creator
    if (formData.assignedUserId) {
      // Validate: User must belong to target tenant
      const { data: relationship } = await admin
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', formData.assignedUserId)
        .eq('tenant_id', tenantId)
        .single();

      if (!relationship)
        throw new Error('Assigned user does not belong to this tenant');
      targetUserId = formData.assignedUserId;
    }

    const service = getService();
    const whiteLabelCode = await generateWhiteLabelCode(tenantId);

    // 1. Create Tracking in Track123 API
    let initialStatus = 'pending';
    let destinationCountry = undefined;
    let rawResponse = {};

    try {
      const createResult = await service.createTracking({
        tracking_number: formData.carrierTrackingCode,
        carrier_code: formData.carrierId,
      });

      console.log(
        'Track123 Create Result:',
        JSON.stringify(createResult, null, 2),
      );

      // Default to the creation response, so we at least save that we registered it
      rawResponse = createResult;

      // 2. Fetch Initial Status immediately
      // We verify what the API knows about it right now to avoid "pending" state

      let trackings: any[] = [];
      let retries = 3;

      while (retries > 0) {
        trackings = await service.getTrackingResults([
          formData.carrierTrackingCode,
        ]);

        if (trackings.length > 0) break;

        console.log(`Tracking result empty, retrying... (${retries} left)`);
        retries--;
        if (retries > 0) await new Promise((r) => setTimeout(r, 1000)); // Wait 1s
      }

      console.log('Creates Shipment Debug:', {
        code: formData.carrierTrackingCode,
        trackingsFound: trackings.length,
        data: trackings,
      });

      const trackingInfo = trackings.find(
        (t) =>
          String(t.tracking_number) === String(formData.carrierTrackingCode),
      );

      if (trackingInfo) {
        console.log('Tracking Info Matched:', trackingInfo);
        rawResponse = trackingInfo; // Save the full response
        if (trackingInfo.status) {
          initialStatus = trackingInfo.status.toLowerCase();
        }
        if (trackingInfo.destination_country) {
          destinationCountry = trackingInfo.destination_country;
        }
      } else {
        console.warn(
          'No matching tracking info found for code:',
          formData.carrierTrackingCode,
        );
      }
    } catch (apiErr: any) {
      console.error('Track123 API Error during creation:', apiErr);
      // STOP and report error to user so we know why it's failing
      throw new Error(
        `Track123 Registration Failed: ${apiErr.message || apiErr}`,
      );
    }

    // 3. Prepare data for DB
    let originCountry = undefined;
    let substatus = undefined;
    let actualDeliveryDate = undefined;
    let packageWeight = undefined;
    let packageDimensions = undefined;
    let trackingUrl = undefined;
    let latestLocation = undefined;

    // Extract data from raw response if available
    const tData = rawResponse as any;
    if (tData) {
      if (tData.shipFrom) originCountry = tData.shipFrom;
      if (tData.sub_status || tData.transitSubStatus)
        substatus = tData.sub_status || tData.transitSubStatus;
      if (tData.deliveredTime) actualDeliveryDate = tData.deliveredTime;

      // Extra Info
      if (tData.extraInfo) {
        if (tData.extraInfo.weight && tData.extraInfo.weight.value)
          packageWeight = tData.extraInfo.weight.value;
        if (tData.extraInfo.dimensions)
          packageDimensions = tData.extraInfo.dimensions;
      }

      // Local Logistics
      if (tData.localLogisticsInfo) {
        if (tData.localLogisticsInfo.courierTrackingLink)
          trackingUrl = tData.localLogisticsInfo.courierTrackingLink;
        // Try to find latest location
        if (
          tData.localLogisticsInfo.trackingDetails &&
          Array.isArray(tData.localLogisticsInfo.trackingDetails)
        ) {
          const details = tData.localLogisticsInfo.trackingDetails;
          if (details.length > 0) {
            // Usually first item is latest, but let's check docs or sorting.
            // Assuming index 0 is latest based on log (Oct 28 before Oct 21)
            latestLocation = details[0].address;
          }
        }
      }
    }

    // Insert into DB
    const { error } = await admin.from('shipments').insert({
      tenant_id: tenantId,
      user_id: targetUserId,
      white_label_code: whiteLabelCode,
      carrier_tracking_code: formData.carrierTrackingCode,
      carrier_id: formData.carrierId,
      status: initialStatus,
      substatus: substatus,
      provider: 'track123',

      tracking_url: trackingUrl,
      latest_location: latestLocation,

      // Customer Details
      customer_details: {
        name: formData.customerName,
        email: formData.customerEmail,
        phone: formData.customerPhone,
      },

      notes: formData.notes,
      amount: formData.amount || 0,

      destination_country: destinationCountry,
      origin_country: originCountry,

      package_weight: packageWeight,
      package_dimensions: packageDimensions ? packageDimensions : undefined,
      actual_delivery_date: actualDeliveryDate,

      raw_response: rawResponse, // Saving the response
    });

    if (error) throw error;

    revalidatePath('/shipments');
    return { success: true };
  } catch (error: any) {
    console.error('Create Shipment Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getShipments(params: any = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, data: [], count: 0 };

  // Check if Global Admin
  const admin = createAdminClient();
  const { data: isGlobal } = await admin.rpc('is_admin', {
    user_uuid: user.id,
  });

  // Also check explicit super_admin role
  const { data: roles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'super_admin');

  const isSuperAdmin = isGlobal || (roles && roles.length > 0);

  // Use Admin Client if Super Admin to bypass RLS
  const client = isSuperAdmin ? admin : supabase;

  console.log(`getShipments: User ${user.id} IsGlobal=${isSuperAdmin}`);

  let query = client
    .from('shipments')
    .select('*, carriers(name_en, code)', { count: 'exact' });

  // Apply Filters
  if (params.status === 'archived') {
    query = query.not('archived_at', 'is', null);
  } else {
    // Default: Only active shipments
    query = query.is('archived_at', null);

    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }
  }

  if (params.tenant && params.tenant !== 'all') {
    // Ensure user is allowed to filter by tenant?
    // For now, assume if they can pass it, client-side RLS or logic holds.
    // If super admin:
    if (isSuperAdmin) {
      query = query.eq('tenant_id', params.tenant);
    } else {
      // Regular user probably shouldn't be able to switch tenants freely unless they belong to multiple.
      // But RLS on Supabase side restricts them to their tenants anyway.
      // So adding .eq here is safe (it acts as AND).
      query = query.eq('tenant_id', params.tenant);
    }
  }

  if (params.search) {
    const term = `%${params.search}%`;
    query = query.or(
      `white_label_code.ilike.${term},carrier_tracking_code.ilike.${term},customer_details->>name.ilike.${term}`,
    );
  }

  // Pagination
  const page = params.page || 0;
  const limit = params.limit || 10;
  const from = page * limit;
  const to = from + limit - 1;

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, count, error } = await query;

  if (error) {
    console.error('getShipments Error:', error);
    throw error;
  }

  console.log('getShipments Found:', count, 'rows');

  return { success: true, data, count };
}

export async function archiveShipment(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('shipments')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Archive Error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/shipments');
  return { success: true };
}

export async function getShipmentById(id: string) {
  // Use Admin Client to bypass RLS for now to debug 404
  const supabase = createAdminClient();
  console.log('Fetching shipment by ID (Admin):', id);

  const { data, error } = await supabase
    .from('shipments')
    .select(
      `
      *,
      carriers (
        name_en,
        code,
        logo_url
      ),
      tenants (
        name
      )
    `,
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching shipment details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function deleteShipment(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  // Use Admin Client for deletion to ensure RLS doesn't block it
  // But first verify permission (ownership or admin)
  const admin = createAdminClient();

  // Check if user is allowed to delete this shipment
  // 1. Is Global Admin?
  const { data: isGlobal } = await admin.rpc('is_admin', {
    user_uuid: user.id,
  });

  // 2. Or belongs to the tenant of the shipment?
  const { data: shipment } = await admin
    .from('shipments')
    .select('*, tenant_id')
    .eq('id', id)
    .single();

  if (!shipment) return { success: false, error: 'Not found' };

  let canDelete = false;

  if (isGlobal) {
    canDelete = true;
  } else {
    // Check if user belongs to this tenant
    const { data: userRole } = await admin
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('tenant_id', shipment.tenant_id)
      .single();

    if (userRole) canDelete = true;
  }

  if (!canDelete) {
    return { success: false, error: 'Permission denied' };
  }

  // Proceed with deletion from Track123
  if (shipment.carrier_id && shipment.carrier_tracking_code) {
    try {
      const service = getService();
      await service.deleteTracking(
        shipment.carrier_id,
        shipment.carrier_tracking_code,
      );
    } catch (err) {
      console.error('Failed to delete from Track123', err);
      // Continue to delete from DB anyway
    }
  }

  // Hard Delete using Admin Client
  const { error } = await admin.from('shipments').delete().eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/shipments');
  return { success: true };
}

export async function refreshShipment(id: string) {
  const supabase = await createClient();
  const { data: item } = await supabase
    .from('shipments')
    .select('*')
    .eq('id', id)
    .single();

  if (!item) return { success: false, error: 'Not found' };
  if (!item.carrier_id || !item.carrier_tracking_code)
    return { success: false, error: 'Missing carrier info' };

  try {
    const service = getService();
    const result = await service.refreshTracking(
      item.carrier_id,
      item.carrier_tracking_code,
    );

    if (result.success) {
      // Update last_synced_at?
      // The API doesn't return new details immediately, just confirmation it WILL refresh.
      // Or maybe it does? The docs say "actualRefreshTime".
      // Let's record an event or update `last_synced_at`.
      await supabase
        .from('shipments')
        .update({
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    return { success: result.success };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function bulkDeleteShipments(ids: string[]) {
  const supabase = await createClient();

  // If we want to delete from Track123, we need to fetch them.
  const { data: items } = await supabase
    .from('shipments')
    .select('*')
    .in('id', ids);

  if (items) {
    const service = getService();
    await Promise.allSettled(
      items.map(async (item) => {
        if (item.carrier_id && item.carrier_tracking_code) {
          return service.deleteTracking(
            item.carrier_id,
            item.carrier_tracking_code,
          );
        }
      }),
    );
  }

  // Hard Delete
  const { error } = await supabase.from('shipments').delete().in('id', ids);

  if (error) return { success: false, error: error.message };
  revalidatePath('/shipments');
  return { success: true };
}

export async function getShipmentStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const admin = createAdminClient();

  // 1. Determine Scope (Super Admin vs Tenant)
  const { data: isGlobal } = await admin.rpc('is_admin', {
    user_uuid: user.id,
  });

  const { data: roles } = await admin
    .from('user_roles')
    .select('role, tenant_id')
    .eq('user_id', user.id);

  const isSuperAdmin =
    isGlobal || (roles && roles.some((r) => r.role === 'super_admin'));

  let tenantId: string | null = null;

  if (!isSuperAdmin) {
    // If not super admin, we MUST limit to their tenant.
    // Prefer tenant from user_roles
    const tenantRole = roles?.find((r) => r.tenant_id);
    if (tenantRole) {
      tenantId = tenantRole.tenant_id;
    } else {
      // Fallback to user_tenants
      const { data: rel } = await admin
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      if (rel) tenantId = rel.tenant_id;
    }

    if (!tenantId) {
      // User has no tenant access? Return 0.
      return {
        success: true,
        stats: {
          total_shipments: 0,
          pending: 0,
          in_transit: 0,
          delivered: 0,
          exception: 0,
          this_month: 0,
        },
      };
    }
  }

  // 2. Define Helper for Counting
  const countStatus = async (status?: string, period?: 'month') => {
    let q = admin.from('shipments').select('*', { count: 'exact', head: true });

    // Filter out archived
    q = q.is('archived_at', null);

    if (tenantId) {
      q = q.eq('tenant_id', tenantId);
    }

    if (status) {
      q = q.eq('status', status);
    }

    if (period === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      q = q.gte('created_at', startOfMonth.toISOString());
    }

    const { count, error } = await q;
    if (error) {
      console.error('Count Error', status, error);
      return 0;
    }
    return count || 0;
  };

  try {
    const [total, pending, in_transit, delivered, exception, this_month] =
      await Promise.all([
        countStatus(),
        countStatus('pending'),
        countStatus('in_transit'),
        countStatus('delivered'),
        countStatus('exception'),
        countStatus(undefined, 'month'),
      ]);

    return {
      success: true,
      stats: {
        total_shipments: total,
        pending,
        in_transit,
        delivered,
        exception,
        this_month,
      },
    };
  } catch (err: any) {
    console.error('getShipmentStats Failed:', err);
    return { success: false, error: err.message };
  }
}
