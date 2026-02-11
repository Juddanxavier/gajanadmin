/** @format */

import { createAdminClient } from '@/lib/supabase/admin';
import { User } from '@supabase/supabase-js';

export type TenantContext = {
  tenantId: string | null;
  isGlobal: boolean;
  isSuperAdmin: boolean;
  role: string | null;
  user: User;
};

/**
 * consistently determines the tenant context for a given user.
 * This replaces the repetitive logic found in server actions.
 */
export async function getTenantContext(user: User): Promise<TenantContext> {
  const admin = createAdminClient();

  // 1. Check Global Admin / Super Admin status
  const { data: isGlobal } = await admin.rpc('is_admin', {
    user_uuid: user.id,
  });

  const { data: roles } = await admin
    .from('user_roles')
    .select('role, tenant_id')
    .eq('user_id', user.id);

  const isSuperAdmin =
    !!isGlobal || roles?.some((r) => r.role === 'super_admin') || false;

  // 2. Determine Tenant ID
  let tenantId: string | null = null;
  let role: string | null = null;

  if (roles && roles.length > 0) {
    // Prefer tenant from user_roles
    const tenantRole = roles.find((r) => r.tenant_id);
    if (tenantRole) {
      tenantId = tenantRole.tenant_id;
      role = tenantRole.role;
    }
  }

  // Fallback to user_tenants if no role-based tenant found (e.g. member)
  if (!tenantId) {
    const { data: rel } = await admin
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    if (rel) {
      tenantId = rel.tenant_id;
      role = 'member'; // Default role if not in user_roles
    }
  }

  return {
    tenantId,
    isGlobal: !!isGlobal,
    isSuperAdmin,
    role,
    user,
  };
}
