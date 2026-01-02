import { createClient } from "@/lib/supabase/server";

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  const { data } = await supabase.rpc("is_admin", { user_uuid: user.id });
  return data === true;
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(roleName: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  const { data } = await supabase.rpc("user_has_role", {
    user_uuid: user.id,
    role_name_param: roleName,
  });
  
  return data === true;
}

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(permissionName: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  const { data } = await supabase.rpc("user_has_permission", {
    user_uuid: user.id,
    permission_name_param: permissionName,
  });
  
  return data === true;
}

/**
 * Get the current user's tenant IDs
 */
export async function getUserTenantIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];
  
  const { data } = await supabase.rpc("get_user_tenants", {
    user_uuid: user.id,
  });
  
  if (!data) return [];
  
  return data.map((t: { tenant_id: string }) => t.tenant_id);
}

/**
 * Get the current user's roles
 */
export async function getUserRoles(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];
  
  const { data } = await supabase.rpc("get_user_roles", {
    user_uuid: user.id,
  });
  
  if (!data) return [];
  
  return data.map((r: { role_name: string }) => r.role_name);
}

/**
 * Check if user can view all users (admin only)
 */
export async function canViewAllUsers(): Promise<boolean> {
  return await isAdmin();
}

/**
 * Check if user can manage users (create, update, delete)
 */
export async function canManageUsers(): Promise<boolean> {
  return await hasPermission("users.create") || await isAdmin();
}

/**
 * Ensure the current user has staff access (Admin or Staff role)
 * Throws error if not authorized.
 * Returns user and role flags.
 */
export async function ensureStaffAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  // We can reuse the existing exports, but be mindful they fetch user again.
  // For performance, we might want to pass user to them if they supported it, 
  // but for now we'll stick to functional correctness.
  
  // However, since we are in the same file, we can't easily "call" the exported function 
  // if we want to avoid double-fetching without refactoring them.
  // But let's look at isAdmin(): checks rpc 'is_admin'.
  // hasRole('staff'): checks rpc 'user_has_role'.
  
  const admin = await isAdmin();
  const staff = await hasRole('staff');

  if (!admin && !staff) {
    throw new Error('Permission denied');
  }
  
  return { user, isUserAdmin: admin, isUserStaff: staff };
}
