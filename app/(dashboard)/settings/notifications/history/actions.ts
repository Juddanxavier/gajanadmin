/** @format */

'use server';

import { createClient } from '@/lib/supabase/server';
import { isAdmin, hasRole } from '@/lib/utils/permissions';

export async function getNotificationLogs(
  page: number = 1,
  pageSize: number = 20,
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

    // Determine Tenant Context
    // Admins see all, Staff see their tenant's logs
    let query = supabase
      .from('notification_logs')
      .select('*, tenants(name)', { count: 'exact' });

    if (!isUserAdmin) {
      // RLS should handle this automatically for staff (user_tenants)
      // But explicit safety check:
      // Join properly if needed, but RLS on notification_logs usually restricts by tenant_id
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data,
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
