/** @format */

'use server';

import { createClient } from '@/lib/supabase/server';
import { isAdmin, hasRole } from '@/lib/utils/permissions';

export async function getNotificationLogs(
  page: number = 1,
  pageSize: number = 20,
  tenantIdOverride?: string,
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const isUserAdmin = await isAdmin();
    const isUserStaff = await hasRole('staff');

    if (!isUserAdmin && !isUserStaff) {
      return { success: false, error: 'Permission denied' };
    }

    let tenantId = tenantIdOverride;
    // If not admin, force tenant check via user_tenants if not strictly RLS'd (but let's be safe)
    if (!isUserAdmin) {
      // Typically handled by RLS, but for actions sometimes we need the ID for explicit queries
      // user_tenants query here if needed, but RLS is safer.
      // We'll trust RLS on the table select.
    }

    // Prepare Query
    let query = supabase
      .from('notification_logs')
      .select('*, tenants(name)', { count: 'exact' });

    // Optional: Filter by tenantId if provided (and allowed)
    // If admin provides tenantId, filter. If staff, RLS handles or we should filter to only their tenants.
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Map for compatibility
    const mapped = (data || []).map((log: any) => ({
      ...log,
      providerName: log.provider_id || 'System',
    }));

    return {
      success: true,
      data: mapped,
      metadata: {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  } catch (error: any) {
    console.error('Error fetching notification logs:', error);
    return { success: false, error: error.message };
  }
}

export async function getNotificationStats(tenantId?: string) {
  const supabase = await createClient();

  // RLS will restrict this count to user's allowed tenants automatically
  // But if we want specific tenant stats, filtering is key.

  let baseQuery = supabase
    .from('notification_logs')
    .select('*', { count: 'exact', head: true });

  if (tenantId) {
    baseQuery = baseQuery.eq('tenant_id', tenantId);
  }

  // We can't reuse the query object easily for different filters in parellel promises in supabase-js sometimes (it mutates),
  // so we construct fresh chains.

  const qTotal = supabase
    .from('notification_logs')
    .select('*', { count: 'exact', head: true });
  const qSent = supabase
    .from('notification_logs')
    .select('*', { count: 'exact', head: true })
    .or('status.eq.sent,status.eq.delivered,status.eq.success');
  const qFailed = supabase
    .from('notification_logs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed');

  if (tenantId) {
    qTotal.eq('tenant_id', tenantId);
    qSent.eq('tenant_id', tenantId);
    qFailed.eq('tenant_id', tenantId);
  }

  const [total, sent, failed] = await Promise.all([qTotal, qSent, qFailed]);

  return {
    total: total.count || 0,
    sent: sent.count || 0,
    failed: failed.count || 0,
  };
}
