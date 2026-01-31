/** @format */

import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

/**
 * Check if the current user is an admin
 */
export async function isAdmin(user?: User | null): Promise<boolean> {
  const supabase = await createClient();

  let targetUser = user;
  if (targetUser === undefined) {
    const { data } = await supabase.auth.getUser();
    targetUser = data.user;
  }

  if (!targetUser) return false;

  const { data } = await supabase.rpc('is_admin', { user_uuid: targetUser.id });
  return data === true;
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(
  roleName: string,
  user?: User | null,
): Promise<boolean> {
  const supabase = await createClient();

  let targetUser = user;
  if (targetUser === undefined) {
    const { data } = await supabase.auth.getUser();
    targetUser = data.user;
  }

  if (!targetUser) return false;

  const { data } = await supabase.rpc('user_has_role', {
    user_uuid: targetUser.id,
    role_name_param: roleName,
  });

  return data === true;
}

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(
  permissionName: string,
  user?: User | null,
): Promise<boolean> {
  const supabase = await createClient();

  let targetUser = user;
  if (targetUser === undefined) {
    const { data } = await supabase.auth.getUser();
    targetUser = data.user;
  }

  if (!targetUser) return false;

  const { data } = await supabase.rpc('user_has_permission', {
    user_uuid: targetUser.id,
    permission_name_param: permissionName,
  });

  return data === true;
}

/**
 * Get the current user's tenant IDs
 */
export async function getUserTenantIds(user?: User | null): Promise<string[]> {
  const supabase = await createClient();

  let targetUser = user;
  if (targetUser === undefined) {
    const { data } = await supabase.auth.getUser();
    targetUser = data.user;
  }

  if (!targetUser) return [];

  const { data } = await supabase.rpc('get_user_tenants', {
    user_uuid: targetUser.id,
  });

  if (!data) return [];

  return data.map((t: { tenant_id: string }) => t.tenant_id);
}

/**
 * Get the current user's roles
 */
export async function getUserRoles(user?: User | null): Promise<string[]> {
  const supabase = await createClient();

  let targetUser = user;
  if (targetUser === undefined) {
    const { data } = await supabase.auth.getUser();
    targetUser = data.user;
  }

  if (!targetUser) return [];

  const { data } = await supabase.rpc('get_user_roles', {
    user_uuid: targetUser.id,
  });

  if (!data) return [];

  return data.map((r: { role_name: string }) => r.role_name);
}

/**
 * Check if user can view all users (admin only)
 */
export async function canViewAllUsers(user?: User | null): Promise<boolean> {
  return await isAdmin(user);
}

/**
 * Check if user can manage users (create, update, delete)
 */
export async function canManageUsers(user?: User | null): Promise<boolean> {
  return (await hasPermission('users.create', user)) || (await isAdmin(user));
}

/**
 * Ensure the current user has staff access (Admin or Staff role)
 * Throws error if not authorized.
 * Returns user and role flags.
 */
export async function ensureStaffAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const admin = await isAdmin(user);
  const staff = await hasRole('staff', user);

  if (!admin && !staff) {
    throw new Error('Permission denied');
  }

  return { user, isUserAdmin: admin, isUserStaff: staff };
}
