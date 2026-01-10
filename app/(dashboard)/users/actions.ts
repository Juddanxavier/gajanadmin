/** @format */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  UserDisplay,
  UserTableFilters,
  PaginatedResponse,
  ActionResponse,
  CreateUserInput,
  UpdateUserInput,
  UserStats,
} from '@/lib/types';
import { successResponse, errorResponse } from '@/lib/api-response';
import {
  isAdmin,
  getUserTenantIds,
  hasPermission,
} from '@/lib/utils/permissions';
import { UserService } from '@/lib/services/user-service';
import { getCurrentTenantId } from '@/lib/auth/session';

export async function getUsers(
  page: number = 0,
  pageSize: number = 10,
  filters: UserTableFilters = {},
  sortBy?: { id: string; desc: boolean }
): Promise<ActionResponse<PaginatedResponse<UserDisplay>>> {
  console.log('getUsers called', {
    page,
    pageSize,
    filters: JSON.stringify(filters),
  });
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return errorResponse(new Error('Unauthorized'));

    const userIsAdmin = await isAdmin();
    const userTenantIds = await getUserTenantIds();

    const service = new UserService(supabase);
    const result = await service.getUsers(
      page,
      pageSize,
      {
        ...filters,
        tenantIds: userIsAdmin ? undefined : userTenantIds,
        excludeAdmins: !userIsAdmin,
      },
      sortBy
    );

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function createUser(
  input: CreateUserInput
): Promise<ActionResponse<UserDisplay>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return errorResponse(new Error('Unauthorized'));

    const canCreate = await hasPermission('users.create');
    if (!canCreate) return errorResponse(new Error('Permission denied'));

    // Hierarchy Enforcement
    const isGlobalAdmin = await isAdmin();

    // Fetch target role details to check its name/type
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('name')
      .eq('id', input.role)
      .single();

    if (roleError || !roleData)
      return errorResponse(new Error('Invalid role selected'));

    // Rule: Only Global Admin can create 'admin' role
    if (roleData.name === 'admin' && !isGlobalAdmin) {
      return errorResponse(
        new Error('Only Global Admins can create new Admins.')
      );
    }

    // Rule: Tenant Admins can only create users for their own tenant
    if (!isGlobalAdmin) {
      const userTenantIds = await getUserTenantIds();
      if (!userTenantIds.includes(input.tenant)) {
        return errorResponse(
          new Error('You can only create users for your assigned tenant.')
        );
      }
    }

    const service = new UserService(supabase);
    // ... existing logic ...
    const newUser = await service.createUser(input, user.id);
    if (!newUser) throw new Error('Failed to return created user');

    revalidatePath('/admin/users');
    return successResponse(newUser);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput
): Promise<ActionResponse<UserDisplay>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('updateUser: No user found');
      return errorResponse(new Error('Unauthorized'));
    }

    // Check permissions
    const canUpdate = await hasPermission('users.update');
    const isGlobalAdmin = await isAdmin();

    console.log(
      `updateUser: User ${user.id} - GlobalAdmin: ${isGlobalAdmin}, Permissions(users.update): ${canUpdate}`
    );

    if (!isGlobalAdmin && !canUpdate) {
      console.log('updateUser: Permission denied');
      return errorResponse(new Error('Permission denied'));
    }

    // Hierarchy & Tenant checks could be added here similar to create
    // For now, relying on service to handle logic or simple permission check

    // Check if tenant admin is trying to update a global admin?
    // Not strictly enforced yet but good to keep in mind.

    const service = new UserService(supabase);
    const updatedUser = await service.updateUser(userId, input, user.id);

    if (!updatedUser) throw new Error('Failed to update user');

    revalidatePath('/admin/users');
    return successResponse(updatedUser);
  } catch (error) {
    return errorResponse(error);
  }
}

// ... existing code ...

export async function getAvailableRoles() {
  const supabase = await createClient();
  const userIsAdmin = await isAdmin(); // true = Global Admin, false = Tenant Admin (or Staff)

  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name');
  if (error) throw error;

  // Hierarchy Logic:
  // Global Admin: Sees All
  // Tenant Admin: Sees everything EXCEPT 'admin' (can create staff/customer)
  // Staff: Sees nothing (or customer? usually staff don't create users)

  if (!userIsAdmin) {
    // Return all except 'admin'
    return data.filter((role) => role.name !== 'admin');
  }
  return data;
}

import { createAdminClient } from '@/lib/supabase/admin';

export async function getTenants() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data.map((t: any) => ({ ...t, code: t.country_code }));
}

export async function getAvailableTenants() {
  return getTenants();
}

export async function getUserDefaultTenant() {
  return await getCurrentTenantId();
}

export async function getTeamMembersAction(): Promise<
  ActionResponse<UserDisplay[]>
> {
  try {
    const supabase = await createClient();
    const tenantId = await getCurrentTenantId();
    const service = new UserService(supabase);
    // If admin, they might want all members across tenants, but usually within context.
    // For now, use current tenant context if available.
    const members = await service.getTeamMembers(tenantId || undefined);
    return successResponse(members);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function deleteUser(
  userId: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return errorResponse(new Error('Unauthorized'));

    const canDelete = await hasPermission('users.delete');
    const isGlobalAdmin = await isAdmin();

    if (!isGlobalAdmin && !canDelete) {
      return errorResponse(new Error('Permission denied'));
    }

    const service = new UserService(supabase);
    await service.deleteUser(userId);

    revalidatePath('/admin/users');
    return successResponse(undefined);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function bulkDeleteUsers(
  userIds: string[]
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return errorResponse(new Error('Unauthorized'));

    const canDelete = await hasPermission('users.delete');
    const isGlobalAdmin = await isAdmin();

    if (!isGlobalAdmin && !canDelete) {
      return errorResponse(new Error('Permission denied'));
    }

    const service = new UserService(supabase);
    // Execute in parallel
    await Promise.all(userIds.map((id) => service.deleteUser(id)));

    revalidatePath('/admin/users');
    return successResponse(undefined);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function getUserStats(): Promise<ActionResponse<UserStats>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return errorResponse(new Error('Unauthorized'));

    // Get user's tenant IDs
    // Global tenant (tenant_id IS NULL) will have empty array → sees all data
    // India/Sri Lanka tenants will have their tenant IDs → filtered data
    const userIsAdmin = await isAdmin();
    const userTenantIds = await getUserTenantIds();

    const service = new UserService(supabase);

    // If userTenantIds is empty/undefined → Global tenant → see all
    // If userTenantIds has values → Filter by those tenant IDs
    // Admin role also sees all (for backwards compatibility)
    const stats = await service.getStats(
      userIsAdmin || !userTenantIds || userTenantIds.length === 0
        ? undefined
        : userTenantIds
    );

    return successResponse(stats);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function getUserTrendsAction(
  days: number = 30
): Promise<ActionResponse<{ date: string; total: number }[]>> {
  try {
    const supabase = await createClient();
    const service = new UserService(supabase);
    const trends = await service.getUserTrends(days);
    return successResponse(trends);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function getUserDetailedTrendsAction(days: number = 30): Promise<
  ActionResponse<
    {
      date: string;
      totalUsers: number;
      activeUsers: number;
      admins: number;
      tenants: number;
    }[]
  >
> {
  try {
    const supabase = await createClient();

    // Get user's tenant IDs for filtering
    // Global tenant (tenant_id IS NULL) will have empty array → sees all trends
    // India/Sri Lanka tenants will have their tenant IDs → filtered trends
    const userIsAdmin = await isAdmin();
    const userTenantIds = await getUserTenantIds();

    const service = new UserService(supabase);

    // If userTenantIds is empty/undefined → Global tenant → see all
    // If userTenantIds has values → Filter by those tenant IDs
    // Admin role also sees all (for backwards compatibility)
    const trends = await service.getUserDetailedTrends(
      days,
      userIsAdmin || !userTenantIds || userTenantIds.length === 0
        ? undefined
        : userTenantIds
    );

    return successResponse(trends);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function bulkAssignRole(
  userIds: string[],
  role: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return errorResponse(new Error('Unauthorized'));

    const canUpdate = await hasPermission('users.update');
    const isGlobalAdmin = await isAdmin();

    if (!isGlobalAdmin && !canUpdate) {
      return errorResponse(new Error('Permission denied'));
    }

    const service = new UserService(supabase);

    // Execute in parallel
    // We reuse updateUser which handles role assignment logic
    await Promise.all(
      userIds.map((id) => service.updateUser(id, { roles: [role] }, user.id))
    );

    revalidatePath('/admin/users');
    return successResponse(undefined);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Invite a new user via email (admin only)
 * This will send an invite email using Supabase Auth with your configured email provider
 */
export async function inviteUserByEmailAction(
  email: string,
  redirectTo?: string
): Promise<ActionResponse<{ message: string }>> {
  console.log('[inviteUserByEmailAction] Starting with email:', email);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('[inviteUserByEmailAction] No authenticated user');
      return { success: false, error: 'Unauthorized - Please log in' };
    }

    console.log('[inviteUserByEmailAction] Current user:', user.id);

    // Check if current user is admin
    const userIsAdmin = await isAdmin();
    console.log('[inviteUserByEmailAction] Is admin:', userIsAdmin);

    if (!userIsAdmin) {
      console.error('[inviteUserByEmailAction] User is not admin');
      return { success: false, error: 'Only admins can invite users' };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.error('[inviteUserByEmailAction] Invalid email:', email);
      return { success: false, error: 'Invalid email address' };
    }

    const redirectUrl =
      redirectTo ||
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`;
    console.log('[inviteUserByEmailAction] Redirect URL:', redirectUrl);

    // Invite user using admin client - this will send an email
    const adminClient = createAdminClient();
    console.log('[inviteUserByEmailAction] Calling inviteUserByEmail...');

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: redirectUrl,
      }
    );

    if (error) {
      console.error('[inviteUserByEmailAction] Supabase error:', error);
      return {
        success: false,
        error: `Failed to send invite: ${error.message}`,
      };
    }

    console.log(
      '[inviteUserByEmailAction] Success! User invited:',
      data?.user?.id
    );

    return {
      success: true,
      data: {
        message: `Invitation email sent to ${email}. The user will receive an email with a link to set up their account.`,
      },
    };
  } catch (error) {
    console.error('[inviteUserByEmailAction] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to invite user',
    };
  }
}

/**
 * Generate a manual invite link (for copying/sharing manually)
 */
export async function generateInviteLinkAction(
  email: string,
  redirectTo?: string
): Promise<ActionResponse<{ link: string }>> {
  console.log('[generateInviteLinkAction] Starting with email:', email);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('[generateInviteLinkAction] No authenticated user');
      return { success: false, error: 'Unauthorized - Please log in' };
    }

    console.log('[generateInviteLinkAction] Current user:', user.id);

    // Check if current user is admin
    const userIsAdmin = await isAdmin();
    console.log('[generateInviteLinkAction] Is admin:', userIsAdmin);

    if (!userIsAdmin) {
      console.error('[generateInviteLinkAction] User is not admin');
      return { success: false, error: 'Only admins can generate invite links' };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.error('[generateInviteLinkAction] Invalid email:', email);
      return { success: false, error: 'Invalid email address' };
    }

    const redirectUrl =
      redirectTo ||
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`;
    console.log('[generateInviteLinkAction] Redirect URL:', redirectUrl);

    // Generate invite link using admin client
    const adminClient = createAdminClient();
    console.log('[generateInviteLinkAction] Calling generateLink...');

    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('[generateInviteLinkAction] Supabase error:', error);
      return {
        success: false,
        error: `Failed to generate link: ${error.message}`,
      };
    }

    if (!data.properties?.action_link) {
      console.error('[generateInviteLinkAction] No action_link in response');
      return {
        success: false,
        error: 'Failed to generate invite link - no link returned',
      };
    }

    console.log('[generateInviteLinkAction] Success! Link generated');

    return {
      success: true,
      data: { link: data.properties.action_link },
    };
  } catch (error) {
    console.error('[generateInviteLinkAction] Unexpected error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to generate invite link',
    };
  }
}
